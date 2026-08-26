# Design Decisions

Short log of non-obvious choices and why, so the reasoning isn't lost.

## Repo structure

Monorepo (`frontend/` + `backend/` in one repo) rather than two separate
repos. Chosen so the M1 tag and future milestone tags all live on one
timeline, and so a PR can touch both sides of an API change together.

## API collection tool

_TBD — Postman vs. Bruno, decision pending._

## Auth token storage

_TBD — decide when Lab 3 (auth) is built._
