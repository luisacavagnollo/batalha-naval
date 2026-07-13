package com.batalha_naval.repository;

import com.batalha_naval.model.GameRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface GameRecordRepository extends JpaRepository<GameRecord, Long> {

    List<GameRecord> findByPlayer1OrPlayer2OrderByTimestampDesc(String player1, String player2);

    List<GameRecord> findTop10ByPlayer1OrPlayer2OrderByTimestampDesc(String player1, String player2);

    @Query("SELECT g.winner, COUNT(g) as wins FROM GameRecord g WHERE g.singlePlayer = false AND g.winner IS NOT NULL GROUP BY g.winner ORDER BY wins DESC")
    List<Object[]> findMultiplayerRanking();

    @Query(value = "SELECT winner, COUNT(*) as wins FROM game_records WHERE single_player = false AND winner IS NOT NULL GROUP BY winner ORDER BY wins DESC LIMIT 10", nativeQuery = true)
    List<Object[]> findMultiplayerRankingNative();
}
