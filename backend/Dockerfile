FROM python:3.14.2-alpine3.23 AS builder

WORKDIR /code
COPY requirements.txt /code
RUN pip3 install -r requirements.txt
RUN pip install "psycopg[binary]"

COPY . .

ENV FLASK_APP src/app.py
ENV FLASK_ENV development
ENV FLASK_RUN_HOST 0.0.0.0

EXPOSE 8000

CMD flask run --port=${PORT:-8000}

FROM builder AS dev-envs

RUN <<EOF
apk update
apk add git
EOF

RUN <<EOF
addgroup -S docker
adduser -S --shell /bin/bash --ingroup docker vscode
EOF

# install Docker tools (cli, buildx, compose)
COPY --from=gloursdocker/docker / /

CMD flask run --port=${PORT:-8000}