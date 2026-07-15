package com.batalha_naval.controller;

import com.batalha_naval.exception.GameFullException;
import com.batalha_naval.exception.GameNotFoundException;
import com.batalha_naval.exception.InvalidActionException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import javax.validation.ConstraintViolationException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Handler global para exceções REST.
 * Retorna respostas padronizadas com mensagens claras para o cliente.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Trata erros de @Valid em @RequestBody (MethodArgumentNotValidException).
     * Retorna 400 com lista de campos inválidos.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(MethodArgumentNotValidException ex) {
        List<Map<String, String>> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> {
                    Map<String, String> fieldError = new LinkedHashMap<>();
                    fieldError.put("field", error.getField());
                    fieldError.put("message", error.getDefaultMessage());
                    return fieldError;
                })
                .collect(Collectors.toList());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", "Dados inválidos");
        body.put("details", fieldErrors);

        return ResponseEntity.badRequest().body(body);
    }

    /**
     * Trata ConstraintViolationException (validação em parâmetros de método).
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraintViolation(ConstraintViolationException ex) {
        List<String> messages = ex.getConstraintViolations().stream()
                .map(violation -> violation.getMessage())
                .collect(Collectors.toList());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", "Dados inválidos");
        body.put("details", messages);

        return ResponseEntity.badRequest().body(body);
    }

    /**
     * Sala/jogo não encontrado — 404.
     */
    @ExceptionHandler(GameNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleGameNotFound(GameNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", ex.getMessage()));
    }

    /**
     * Sala cheia — 409 Conflict.
     */
    @ExceptionHandler(GameFullException.class)
    public ResponseEntity<Map<String, String>> handleGameFull(GameFullException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", ex.getMessage()));
    }

    /**
     * Ação inválida para o estado atual do jogo — 400.
     */
    @ExceptionHandler(InvalidActionException.class)
    public ResponseEntity<Map<String, String>> handleInvalidAction(InvalidActionException ex) {
        return ResponseEntity.badRequest()
                .body(Map.of("error", ex.getMessage()));
    }

    /**
     * IllegalArgumentException genérica (input inválido) — 400.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.badRequest()
                .body(Map.of("error", ex.getMessage() != null ? ex.getMessage() : "Argumento inválido"));
    }

    /**
     * IllegalStateException genérica (operação inválida no estado atual) — 409 Conflict.
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleIllegalState(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", ex.getMessage() != null ? ex.getMessage() : "Operação inválida para o estado atual"));
    }

    /**
     * Fallback para exceções não tratadas — 500.
     * Loga o erro completo mas retorna mensagem genérica ao cliente.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleUnexpected(Exception ex) {
        log.error("Erro inesperado no controller REST: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Erro interno do servidor"));
    }
}
