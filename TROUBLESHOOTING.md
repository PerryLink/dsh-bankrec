# 排错指南 — dsh-bankrec

> 错误信息统一为 `<一句人话>（E_XXX）｜下一步：<动作>`。完整报错与堆栈只写日志，不打印内部路径。

## 1. 金额列读不懂

- **症状**：导入后提示「金额“abc”读不懂（E_BR_CSV_INVALID）｜下一步：把金额改成 1234.56 这样的纯数字，最多两位小数」。
- **原因**：`amount` 列出现空单元格、字母、三位以上小数，或把负数写成了括号/中文负号。
- **动作**：把该列改成 `1234.56` 或 `-430.00` 这样的纯数字后重跑；不要带单位。

## 2. CSV 表头缺少 date 或 amount

- **症状**：导入后提示「CSV 第一行缺少 date 或 amount 列（E_BR_CSV_INVALID）｜下一步：把表头写成 date,amount 或 date,amount,reference 后重跑」。
- **原因**：第一行不是表头、用了中文列名，或保存时被 Excel 改成了别的写法（大小写会被忽略，拼写不会）。
- **动作**：确认第一行是 `date,amount` 或 `date,amount,reference`，日期用 `YYYY-MM-DD`，再重跑。

## 3. 导出文件名被拒绝

- **症状**：导出时提示「导出文件名“…”含不支持的字符（E_BR_PATH_INVALID）｜下一步：把账户/期间改成字母、数字、- 或 _，文件名不超过 120 字符」。
- **原因**：账户或期间里带了 `/`、空格、中文等会改变文件名或用不了字符。
- **动作**：把 `account_id` / `period` 改成普通字母数字（如 `ACC-001` / `2026-03`）后重新导出。

## 安装或激活失败

- DSH 需满足 `>=0.2.1-rc.3 <0.4.0`，Node 需满足 `>=24.9 <25`。
- 用临时 `DSH_HOME` 排除旧配置干扰：

```sh
export DSH_HOME="$(mktemp -d)"
dsh plugin --profile <profile> add dsh-bankrec
dsh --profile <profile> --dump-config | grep dsh-bankrec
```

## 自己复现

```sh
pnpm build
node samples/quickstart/run.mjs          # 合成样例，应输出 quickstart ok
node --test test/*.test.mjs              # 全绿
```

## 报告问题

请附版本号、最小合成输入和完整工具调用；**不要上传客户数据**。
<https://github.com/PerryLink/dsh-bankrec/issues>
