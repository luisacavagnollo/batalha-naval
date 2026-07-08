package com.batalha_naval.model;

import javax.persistence.*;

@Entity
@Table(name = "app_users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String username;

    @Column(unique = true, nullable = false, length = 100)
    private String email;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(nullable = false)
    private int moedas = 0;

    @Column(nullable = false, length = 50)
    private String skinEquipada = "padrao_antigo";

    @Column(nullable = false, length = 500)
    private String skinsAdquiridas = "padrao_antigo,pirate";

    public User() {
    }

    public User(Long id, String username, String email, String password) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.password = password;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public int getMoedas() {
        return moedas;
    }

    public void setMoedas(int moedas) {
        this.moedas = moedas;
    }

    public String getSkinEquipada() {
        return skinEquipada;
    }

    public void setSkinEquipada(String skinEquipada) {
        this.skinEquipada = skinEquipada;
    }

    public String getSkinsAdquiridas() {
        return skinsAdquiridas;
    }

    public void setSkinsAdquiridas(String skinsAdquiridas) {
        this.skinsAdquiridas = skinsAdquiridas;
    }
}
