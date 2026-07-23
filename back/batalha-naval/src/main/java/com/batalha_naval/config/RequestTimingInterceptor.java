package com.batalha_naval.config;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class RequestTimingInterceptor implements HandlerInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(RequestTimingInterceptor.class);

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        request.setAttribute("requestStartTime", System.currentTimeMillis());
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        Long startTime = (Long) request.getAttribute("requestStartTime");
        if (startTime != null) {
            long elapsedTime = System.currentTimeMillis() - startTime;
            if (elapsedTime > 1000) {
                logger.warn("Slow request: method={}, uri={}, status={}, elapsed={}ms",
                        request.getMethod(),
                        request.getRequestURI(),
                        response.getStatus(),
                        elapsedTime);
            }
        }
    }
}
