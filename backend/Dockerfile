FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests -B

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

RUN mkdir -p /app/data

EXPOSE 8080

ENV SPRING_PROFILES_ACTIVE=render
ENV APP_CORS_ORIGINS=http://localhost:*

CMD ["java", "-jar", "app.jar"]
