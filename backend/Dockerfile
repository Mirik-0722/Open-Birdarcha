# syntax=docker/dockerfile:1
# ---- Build: jar yig'amiz ----
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
# --mount=cache: .m2 build'lar orasida saqlanadi — deps qayta yuklanmaydi (BuildKit kerak).
RUN --mount=type=cache,target=/root/.m2 mvn -q -B dependency:go-offline
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 mvn -q -B -DskipTests package

# ---- Run: yengil JRE ----
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/open-birdarcha-*.jar app.jar
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
EXPOSE 8080
ENTRYPOINT ["/docker-entrypoint.sh"]
