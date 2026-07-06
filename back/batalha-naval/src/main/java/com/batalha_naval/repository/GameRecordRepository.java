package com.batalha_naval.repository;

import com.batalha_naval.model.GameRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GameRecordRepository extends JpaRepository<GameRecord, Long> {

    List<GameRecord> findByPlayer1OrPlayer2OrderByTimestampDesc(String player1, String player2);

    List<GameRecord> findTop10ByPlayer1OrPlayer2OrderByTimestampDesc(String player1, String player2);
}
