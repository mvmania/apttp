# APCTT Platform Deployment Guide

이 가이드는 현재 개발된 플랫폼을 다른 인원(약 10명)과 공유할 수 있도록 배포하는 방법을 설명합니다. 모든 코드는 프론트엔드와 백엔드가 하나로 통합되어 배포될 수 있도록 준비되어 있습니다.

## 추천 배포 방식: Railway (가장 빠름)

[Railway](https://railway.app/)는 Docker를 지원하며 설정이 매우 간단합니다.

1.  **GitHub 리포지토리 생성**: 현재 코드를 GitHub에 업로드(Push)합니다.
2.  **Railway 접속**: [railway.app](https://railway.app/)에 가입하고 'New Project'를 클릭합니다.
3.  **GitHub 연결**: 'Deploy from GitHub repo'를 선택하고 해당 리포지토리를 연결합니다.
4.  **자동 배포**: Railway가 리포지토리에 있는 `Dockerfile`을 자동으로 인식하여 빌드 및 배포를 진행합니다.
5.  **공유**: 배포가 완료되면 생성된 도메인(`xxx.up.railway.app`)을 다른 인원에게 공유하면 됩니다.

## 대안 배포 방식: Render

[Render](https://render.com/) 또한 Docker를 지원하는 훌륭한 대안입니다.

1.  GitHub 리포지토리를 연결합니다.
2.  'Web Service'를 생성하고 Runtime을 **Docker**로 선택합니다.
3.  배포가 완료되면 제공되는 URL을 공유합니다.

## 로컬에서 빌드 확인하기

배포 전 로컬에서 통합 버전이 잘 작동하는지 확인하려면 다음 명령어를 실행하세요:

```bash
# 1. 프론트엔드 빌드 및 서버 종속성 설치
npm run build:full

# 2. 통합 서버 실행
npm start
```
이제 [http://localhost:3001](http://localhost:3001)에서 프론트엔드와 백엔드가 합쳐진 전체 서비스를 확인할 수 있습니다.

## 주요 변경 사항 요약
- **서버 통합**: Express 서버가 `dist` 폴더의 정적 파일을 직접 서빙합니다.
- **포트 설정**: 포트는 기본 `3001`을 사용하며, 클라우드 환경의 `PORT` 환경 변수를 따릅니다.
- **데이터 저장**: 현재는 `server/data.json`에 파일 형태로 저장됩니다. (Railway 사용 시 데이터 영속성을 위해 'Volume' 설정이 권장되나, 초기 테스트용으로는 그대로 사용 가능합니다.)
