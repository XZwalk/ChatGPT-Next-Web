# .ide/Dockerfile，在项目根目录下增加此文件
FROM node:18

# install vscode and extension
RUN curl -fsSL https://code-server.dev/install.sh | sh &&\
    code-server --install-extension redhat.vscode-yaml &&\
    code-server --install-extension orta.vscode-jest &&\
    code-server --install-extension dbaeumer.vscode-eslint &&\
    code-server --install-extension eamodio.gitlens &&\
    echo done

# 安装 ssh 服务，用于支持 Vscode 客户端通过 Remote-SSH 访问开发环境
# （如果需要支持客户端打开远程开发环境可安装）
# RUN apt-get update && apt-get install -y wget unzip openssh-server

# 指定字符集支持命令行输入中文（根据需要选择字符集）
ENV LANG C.UTF-8
ENV LANGUAGE C.UTF-8