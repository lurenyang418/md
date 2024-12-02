<div align="center">

[![doocs-md](https://cdn-doocs.oss-cn-shenzhen.aliyuncs.com/gh/doocs/md/images/logo-2.png)](https://github.com/doocs/md)

</div>

<h1 align="center">微信 Markdown 编辑器</h1>

<div align="center">

[![status](https://img.shields.io/github/actions/workflow/status/doocs/md/build.yml?style=flat-square&labelColor=564341&color=42cc23)](https://github.com/doocs/md/actions) [![node](https://img.shields.io/badge/node-%3E%3D20-42cc23?style=flat-square&labelColor=564341)](https://nodejs.org/en/about/previous-releases) [![release](https://img.shields.io/github/v/release/doocs/md?style=flat-square&labelColor=564341&color=42cc23)](https://github.com/doocs/md/releases) [![license](https://img.shields.io/github/license/doocs/md?style=flat-square&labelColor=564341&color=42cc23)](./LICENSE) [![pr](https://img.shields.io/badge/prs-welcome-42cc23?style=flat-square&labelColor=564341)](https://github.com/doocs/md/pulls)<br>[![stars](https://img.shields.io/github/stars/doocs/md?style=flat-square&labelColor=564341&color=42cc23)](https://github.com/doocs/md/stargazers) [![forks](https://img.shields.io/github/forks/doocs/md?style=flat-square&labelColor=564341&color=42cc23)](https://github.com/doocs/md)

</div>

## 项目介绍

[细节见原仓库](https://github.com/doocs/md?tab=readme-ov-file#%E5%BE%AE%E4%BF%A1-markdown-%E7%BC%96%E8%BE%91%E5%99%A8)

在原仓库基础基础删减以下功能

1. md-cli 用不着
2. 去掉阿里云(收费)、腾讯云(收费)、 minio (自建维护成本高)和 自定义上传(懒得搞)的图床
3. 七牛的证书麻烦, 直接使用 Cloudflare 的 r2

## 目前支持哪些图床

| #   | 图床                                                 | 使用时是否需要配置                                                   | 备注                                                                                                                   |
| --- | ---------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 1   | R2                                                   | 如下                                                                 | -                                                                                                                      |
| 2   | [GitHub](https://github.com)                         | 配置 `username`、 `repo`、`token` 参数                               | [如何获取 GitHub token？](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token) |
| 3   | [Cloudflare R2](https://www.qiniu.com/products/kodo) | 配置 `AccountId`、 `AccessKey`、`SecretKey`、`Bucket`、`Domain` 参数 | [如何使用Cloudflare R2 ？](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/)                           |

## 如何开发和部署

```sh
# 安装依赖
npm i

# 启动开发模式
npm start
```

## 快速搭建私有服务

### 使用 Docker 镜像

如果你是 Docker 用户，也可以直接使用一条命令，启动完全属于你的、私有化运行的实例。

```sh
docker run -d -p 8080:80 lurenyang418/md:latest
```

容器运行起来之后，打开浏览器，访问 http://localhost:8080 即可。
