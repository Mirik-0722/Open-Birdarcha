# syntax=docker/dockerfile:1
# ---- Build: jar yig'amiz ----
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
# --mount=cache: .m2 build'lar orasida saqlanadi — deps qayta yuklanmaydi (BuildKit kerak).
RUN --mount=type=cache,target=/root/.m2 mvn -q -B dependency:go-offline
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 mvn -q -B -DskipTests package
# Layered jar'ni qatlamlarga ajratamiz — deps (barqaror) app koddan (o'zgaruvchan) ALOHIDA cache'lanadi.
RUN java -Djarmode=tools -jar target/open-birdarcha-*.jar extract --layers --destination extracted

# ---- Run: yengil JRE, qatlamlar bo'yicha COPY ----
FROM eclipse-temurin:17-jre
WORKDIR /app
# Tartib muhim: barqaror qatlamlar avval (cache-hit), o'zgaruvchan 'application' oxirda.
COPY --from=build /app/extracted/dependencies/ ./
COPY --from=build /app/extracted/spring-boot-loader/ ./
COPY --from=build /app/extracted/snapshot-dependencies/ ./
COPY --from=build /app/extracted/application/ ./
COPY docker-entrypoint.sh /docker-entrypoint.sh
# Versiyali jar'ni app.jar ga o'giramiz; lib/ yonida — Class-Path lib/ ni topadi.
RUN chmod +x /docker-entrypoint.sh && mv open-birdarcha-*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["/docker-entrypoint.sh"]
