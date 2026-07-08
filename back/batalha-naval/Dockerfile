# Build stage
FROM maven:3.8-openjdk-11-slim AS build
WORKDIR /app
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .
RUN chmod +x mvnw
RUN ./mvnw dependency:go-offline -B
COPY src ./src
RUN ./mvnw clean package -DskipTests -B

# Run stage
FROM openjdk:11-jre-slim
WORKDIR /app
COPY --from=build /app/target/batalha-naval-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
