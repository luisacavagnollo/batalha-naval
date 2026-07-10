package com.batalha_naval.controller;

import com.batalha_naval.model.PlayerStats;
import com.batalha_naval.model.User;
import com.batalha_naval.repository.PlayerStatsRepository;
import com.batalha_naval.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
public class ShopController {

    private final UserRepository userRepository;
    private final PlayerStatsRepository playerStatsRepository;

    private static final List<Map<String, Object>> SKIN_CATALOG;

    static {
        SKIN_CATALOG = new ArrayList<>();
        SKIN_CATALOG.add(createSkin("padrao_antigo", "Frota Clássica", 0, true));
        SKIN_CATALOG.add(createSkin("pirate", "Frota Pirata", 0, true));
        SKIN_CATALOG.add(createSkin("padrao", "Frota Imperial", 30, false));
        SKIN_CATALOG.add(createSkin("pirate_op", "Frota Pirata Lendária", 50, false));
        SKIN_CATALOG.add(createSkin("pesca", "Frota Pesqueira", 40, false));
        SKIN_CATALOG.add(createSkin("kitty", "Frota Hello Kitty", 60, false));
    }

    private static Map<String, Object> createSkin(String id, String name, int price, boolean isDefault) {
        Map<String, Object> skin = new LinkedHashMap<>();
        skin.put("id", id);
        skin.put("name", name);
        skin.put("price", price);
        skin.put("default", isDefault);
        return skin;
    }

    public ShopController(UserRepository userRepository, PlayerStatsRepository playerStatsRepository) {
        this.userRepository = userRepository;
        this.playerStatsRepository = playerStatsRepository;
    }

    @GetMapping("/api/shop/skins")
    public ResponseEntity<List<Map<String, Object>>> getSkins(Principal principal) {
        String username = principal.getName();
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) return ResponseEntity.status(401).build();

        Set<String> ownedSkins = parseOwnedSkins(user.getSkinsAdquiridas());

        List<Map<String, Object>> result = SKIN_CATALOG.stream().map(skin -> {
            Map<String, Object> skinResponse = new LinkedHashMap<>(skin);
            skinResponse.put("owned", ownedSkins.contains(skin.get("id")));
            return skinResponse;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @PostMapping("/api/shop/buy")
    public ResponseEntity<?> buySkin(@RequestBody Map<String, String> body, Principal principal) {
        String username = principal.getName();
        String skinId = body.get("skinId");

        if (skinId == null || skinId.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "skinId é obrigatório"));
        }

        // Find skin in catalog
        Map<String, Object> skinData = SKIN_CATALOG.stream()
                .filter(s -> s.get("id").equals(skinId))
                .findFirst()
                .orElse(null);

        if (skinData == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Skin não encontrada"));
        }

        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Sessão expirada"));

        Set<String> ownedSkins = parseOwnedSkins(user.getSkinsAdquiridas());

        if (ownedSkins.contains(skinId)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Você já possui esta skin"));
        }

        int price = (int) skinData.get("price");
        if (user.getMoedas() < price) {
            return ResponseEntity.badRequest().body(Map.of("error", "Moedas insuficientes"));
        }

        // Deduct coins and add skin
        user.setMoedas(user.getMoedas() - price);
        ownedSkins.add(skinId);
        user.setSkinsAdquiridas(String.join(",", ownedSkins));
        userRepository.save(user);

        return ResponseEntity.ok(buildUserResponse(user));
    }

    @GetMapping("/api/profile/me")
    public ResponseEntity<?> getProfile(Principal principal) {
        String username = principal.getName();
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Sessão expirada"));

        PlayerStats stats = playerStatsRepository.findByUsername(username)
                .orElse(new PlayerStats(username));

        int wins = stats.getWins();
        int losses = stats.getLosses();
        int total = wins + losses;
        double winRate = total == 0 ? 0 : Math.round((double) wins / total * 1000.0) / 10.0;

        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("username", user.getUsername());
        profile.put("moedas", user.getMoedas());
        profile.put("skinEquipada", user.getSkinEquipada());
        profile.put("skinsAdquiridas", new ArrayList<>(parseOwnedSkins(user.getSkinsAdquiridas())));
        profile.put("wins", wins);
        profile.put("losses", losses);
        profile.put("winRate", winRate);

        return ResponseEntity.ok(profile);
    }

    @PostMapping("/api/profile/equip")
    public ResponseEntity<?> equipSkin(@RequestBody Map<String, String> body, Principal principal) {
        String username = principal.getName();
        String skinId = body.get("skinId");

        if (skinId == null || skinId.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "skinId é obrigatório"));
        }

        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Sessão expirada"));

        Set<String> ownedSkins = parseOwnedSkins(user.getSkinsAdquiridas());

        if (!ownedSkins.contains(skinId)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Você não possui esta skin"));
        }

        user.setSkinEquipada(skinId);
        userRepository.save(user);

        return ResponseEntity.ok(buildUserResponse(user));
    }

    private Map<String, Object> buildUserResponse(User user) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("username", user.getUsername());
        response.put("moedas", user.getMoedas());
        response.put("skinEquipada", user.getSkinEquipada());
        response.put("skinsAdquiridas", new ArrayList<>(parseOwnedSkins(user.getSkinsAdquiridas())));
        return response;
    }

    /**
     * Parse seguro de skinsAdquiridas — trata null, vazio e strings legacy.
     */
    private static Set<String> parseOwnedSkins(String skinsAdquiridas) {
        if (skinsAdquiridas == null || skinsAdquiridas.isBlank()) {
            // Usuários legacy sem dados — garantir skins default
            return new HashSet<>(Arrays.asList("padrao_antigo", "pirate"));
        }
        Set<String> skins = new HashSet<>();
        for (String s : skinsAdquiridas.split(",")) {
            String trimmed = s.trim();
            if (!trimmed.isEmpty()) {
                skins.add(trimmed);
            }
        }
        // Garantir que skins default sempre existem
        skins.add("padrao_antigo");
        skins.add("pirate");
        return skins;
    }
}
