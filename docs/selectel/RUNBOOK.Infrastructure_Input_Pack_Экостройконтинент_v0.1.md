# RUNBOOK.Infrastructure_Input_Pack_Экостройконтинент_v0.1

## 1. Назначение документа

Этот документ фиксирует входной инфраструктурный пакет для агента по проекту «Экостройконтинент».

Цель документа:
- дать агенту минимально достаточный контекст для инфраструктурной работы;
- не заставлять агента заново выяснять уже принятые решения;
- отделить публичный инфраструктурный контекст от секретов;
- избежать оверинженеринга на phase 1.

Документ не является хранилищем секретов.
Секреты, приватные ключи, токены и пароли передаются отдельно через безопасный канал и не должны коммититься в репозиторий.

---

## 2. Идентификация проекта

- Проект: Экостройконтинент
- Infra project code: `sait`
- Cloud provider: Selectel
- Primary public domain: `ecostroycontinent.ru`
- DNS provider: `Selectel`
- GitHub repository source of truth: `Kwentin3/ecostroycontinent`
- Old typo repo `Kwentin3/ecostroycontinet` is obsolete and must not be treated as source of truth
- Текущая фаза: `phase 1 / launch-core`
- Тип инфраструктуры: простой practical baseline без Kubernetes и без микросервисной схемы
- Основная цель: развернуть минимальную рабочую инфраструктуру для сайта, админки, хранения медиа, деплоя и базовой операционной устойчивости

---

## 3. Канонический инфраструктурный baseline

На текущий момент зафиксированы следующие решения.

### 3.1 Runtime posture

- Используется одна VM в Selectel
- На VM устанавливается Docker Engine
- На VM используется Docker Compose
- Reverse proxy: Traefik
- GitHub self-hosted runner размещается на этой же VM
- Приложение работает в контейнере
- База данных работает в отдельном контейнере на той же VM
- VM sizing baseline:
  - `2 CPU`
  - `2 GB RAM`
  - `30 GB disk`
- Контейнерная схема на phase 1: один стек, два основных контейнера:
  - app
  - sql

### 3.2 Registry and deploy posture

- Репозиторий кода: GitHub `Kwentin3/ecostroycontinent`
- Container registry: GitHub Container Registry (GHCR)
- Deploy path:
  - GitHub Actions собирает образ
  - образ публикуется в GHCR
  - self-hosted runner на VM выполняет деплой
  - Docker Compose обновляет рантайм

### 3.3 Storage posture

- Медиафайлы не должны быть источником истины внутри контейнера
- Для object storage используется Selectel S3
- Используются две отдельные S3-корзины:
  - `media` naming convention
  - `backups` naming convention
- Медиа и резервные копии не должны смешиваться в одной корзине
- Точные final bucket names могут быть выбраны агентом внутри этой semantic split convention

### 3.4 CDN posture

- Для раздачи медиа используется CDN
- CDN ставится перед media-bucket delivery path
- CDN нужен для ускорения раздачи и разгрузки origin

### 3.5 Secrets posture

- Секреты не должны храниться в репозитории
- Секреты не должны быть захардкожены в compose-файлах
- Секреты, ключи, пароли и токены передаются агенту отдельно
- В публичных infra-документах допускаются только ссылки на секреты, имена секретов или пометки вида `provided separately`

### 3.6 Certificates posture

- Self-signed certificates — текущая practical TLS posture для phase 1
- Это допустимо как временное решение для текущего phase-1 runtime и технического доступа
- Production-friendly TLS improvement path будет уточнён позже
- Self-signed posture не должна трактоваться как окончательное ideal final state

### 3.7 Logging and forensic posture

- Логирование обязательно
- Форензика обязательна
- Логи и forensic data считаются first-class concern
- На текущем этапе runtime logging допускается хранить в SQL
- Позже возможен пересмотр log-storage posture
- Логи не должны расти бесконтрольно

### 3.8 Retention posture

Retention обязателен.

Нужно предусмотреть:
- retention для application logs
- retention для forensic events
- retention для backup artifacts
- retention для Docker leftovers
- cleanup policy для старых образов, временных файлов и хвостов

Цель:
- не допустить бесконтрольного роста использования диска на VM
- не допустить молчаливого накопления логов, backup temp-файлов и Docker-артефактов

---

## 4. Что уже подготовлено

### 4.1 Selectel project

Подготовлен проект:

- Project: `sait`

### 4.2 Service user

Подготовлен сервисный пользователь для инфраструктурной автоматизации.

- Service user: `sait`
- Scope: project `sait`
- Role: `member` на проект `sait`

### 4.3 Access preparation

Подготовлены следующие инфраструктурные доступы:

- RC file для Selectel / OpenStack CLI
- SSH key pair для доступа к VM
- S3 credentials для работы с бакетами

### 4.4 S3 buckets plan

Подготовлен план двух корзин:

- bucket `media`
- bucket `backups`

### 4.5 SSH preparation

Подготовлен отдельный SSH key pair для проекта.

Публичный ключ предназначен для размещения на VM.
Приватный ключ не должен попадать в репозиторий.

---

## 5. Что агент получает как вход

Агенту должен быть доступен следующий входной пакет.

### 5.1 Infra context

- этот документ
- PRD инфраструктурного baseline
- последующие infra-contracts, если к моменту работы они уже будут готовы

### 5.2 Runtime target

Агент должен исходить из следующей целевой схемы:

- одна VM
- Docker Engine
- Docker Compose
- Traefik
- app container
- sql container
- GHCR
- GitHub self-hosted runner
- media bucket
- backups bucket
- CDN
- backup flow to S3
- logging baseline
- forensic baseline
- retention / cleanup baseline

### 5.3 Credentials and local assets

Передаются отдельно, не через git:

- Selectel RC file
- пароль service user
- SSH private key
- S3 access key / secret key
- GitHub credentials / tokens при необходимости
- GHCR credentials при необходимости

---

## 6. Что агент должен сделать

Агент должен работать в рамках phase-1 practical baseline и не переоткрывать уже принятые решения без явной причины.

Целевой набор задач:

1. Подготовить минимальный infra-setup path для Selectel
2. Подготовить provisioning path для VM
3. Подготовить object storage path:
   - media bucket
   - backups bucket
4. Подготовить CDN path для media delivery
5. Подготовить host runtime setup:
   - Docker
   - Docker Compose
   - Traefik
6. Подготовить deployment path:
   - GHCR pull
   - self-hosted runner
   - deploy/update flow
7. Подготовить backup path в S3
8. Подготовить retention / cleanup rules
9. Подготовить logging / forensic baseline
10. Подготовить минимальный runbook эксплуатации

---

## 7. Чего агент делать не должен

Следующие направления находятся вне текущего phase-1 scope.

- Не строить Kubernetes
- Не проектировать микросервисную архитектуру
- Не переоткрывать product/content/admin canon
- Не вводить multi-region
- Не строить enterprise-grade network overdesign
- Не писать чрезмерно широкий security manifesto
- Не переносить проект в сложную оркестрацию без явной причины
- Не складывать секреты в репозиторий
- Не смешивать media и backups в один storage path
- Не делать инфраструктурные решения, которые усложняют phase 1 без прямой необходимости

---

## 8. Что пока не зафиксировано окончательно

На момент подготовки этого документа следующие пункты ещё не закреплены окончательно:

- DNS records for `ecostroycontinent.ru`
- final production-friendly TLS improvement path
- backup frequency
- retention numbers
- точная структура runtime logs в SQL
- точная схема persistent volume layout
- момент будущего перехода от sql-in-container к managed database

Если в этих точках агенту нужно принять решение, он должен сначала пометить их как open decision, а не молча фиксировать как уже утверждённые.

---

## 9. Структура передачи секретов

Секреты и ключи не должны находиться в этом документе.

Рекомендуемая схема:

- публичный infra input pack — в docs / repo
- приватный local secrets pack — только локально, без коммита

Пример локального приватного файла:

`LOCAL_SECRETS_NOT_FOR_GIT.md`

В нём могут храниться:
- service user password
- S3 access key / secret key
- SSH private key location
- GitHub tokens
- GHCR credentials
- app env secrets
- db credentials

Этот файл не коммитится.

---

## 10. Минимальный локальный inventory of assets

Ниже шаблон, который можно заполнить локально.

### Selectel

- Project: `sait`
- Service user: `sait`
- Primary public domain: `ecostroycontinent.ru`
- DNS provider: `Selectel`
- RC file path: `docs/selectel/<rc-file-name>`
- Service user password: provided separately

### SSH

- Public key path: `<local-path>.pub`
- Private key path: `<local-path>`
- Passphrase: provided separately / no passphrase

### S3

- Media bucket name: `<agent-choose-within-media-convention>`
- Backup bucket name: `<agent-choose-within-backups-convention>`
- Media access key: provided separately
- Media secret key: provided separately
- Backup access key: provided separately
- Backup secret key: provided separately

### GitHub

- Repository: `Kwentin3/ecostroycontinent`
- GHCR namespace/image: `<fill-later>`
- GitHub runner registration method: `<agent-choose-simplest-acceptable>`
- GitHub token / runner token: provided separately

---

## 11. Критерий готовности входного пакета

Input pack считается готовым, если:

- project в Selectel создан
- service user создан
- service user имеет project-level access
- RC file скачан
- SSH key pair подготовлен
- S3 credentials подготовлены
- phase-1 infra baseline зафиксирован
- список non-goals зафиксирован
- секреты отделены от публичной документации

---

## 12. Краткое резюме для агента

Нужно развернуть минимальную инфраструктуру проекта «Экостройконтинент» на Selectel без оверинженеринга.

Принятые ограничения:
- один VM-host
- `2 CPU / 2 GB RAM / 30 GB disk`
- Docker + Compose
- Traefik
- один compose stack
- app + sql в контейнерах
- GHCR
- self-hosted GitHub runner
- S3:
  - media
  - backups
- CDN
- backup to S3
- logging + forensics
- retention mandatory

Запрещено:
- Kubernetes
- микросервисы
- переоткрытие продуктового канона
- хранение секретов в репозитории

Open decisions:
- DNS for `ecostroycontinent.ru`
- final production-friendly TLS improvement path
- exact persistent volume layout
- exact backup/retention numbers
