#!/bin/sh
set -e

# DATABASE_URL (postgres://user:pass@host:port/db) -> Spring uchun DB_URL/DB_USERNAME/DB_PASSWORD
if [ -n "$DATABASE_URL" ]; then
  rest="${DATABASE_URL#*://}"            # scheme'ni olib tashlaymiz
  if [ "$rest" != "$DATABASE_URL" ]; then
    creds="${rest%%@*}"
    hostpath="${rest#*@}"
    if [ "$creds" != "$rest" ]; then      # user:pass@ qismi bormi
      DB_USERNAME="${creds%%:*}"
      DB_PASSWORD="${creds#*:}"
      export DB_USERNAME DB_PASSWORD
    fi
    export DB_URL="jdbc:postgresql://${hostpath}"
  fi
fi

exec java -jar app.jar
