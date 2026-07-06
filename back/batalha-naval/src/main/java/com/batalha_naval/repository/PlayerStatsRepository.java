package com.batalha_naval.repository;

import com.batalha_naval.model.PlayerStats;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PlayerStatsRepository extends JpaRepository<PlayerStats, Long> {

    Optional<PlayerStats> findByUsername(String username);
}
