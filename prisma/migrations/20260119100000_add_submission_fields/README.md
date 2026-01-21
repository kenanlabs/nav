# 添加网站收录功能

## 描述
为 Site 表添加提交者联系方式和 IP 字段，为 SystemSettings 添加收录功能配置。

## 字段变更

### Site 表
- `submitter_contact` (TEXT, 可选) - 提交者联系方式（邮箱/微信）
- `submitter_ip` (TEXT, 可选) - 提交者 IP 地址（用于区分用户提交和管理员创建）

### SystemSettings 表
- `enable_submission` (BOOLEAN, 默认 true) - 是否启用网站收录功能
- `submission_max_per_day` (INTEGER, 默认 3) - 同一 IP 24 小时内最多提交次数

## 版本
v0.0.8

## 日期
2026-01-19
