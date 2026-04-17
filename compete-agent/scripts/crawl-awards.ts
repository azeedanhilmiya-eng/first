/**
 * 往届获奖项目采集入口。MVP 起步仅给出脚手架与 TODO，首版用公开获奖名单 + 路演/新闻报道。
 *
 * 使用：ANTHROPIC_API_KEY=... tsx scripts/crawl-awards.ts
 */
async function main() {
  // TODO(W1):
  //   1. 拉取 tiaozhanbei.net 与 cy.ncss.cn 的公开获奖名单页
  //   2. 从 B 站公开路演视频字幕、主流媒体获奖报道中抽取项目介绍
  //   3. 用 Claude 做结构化抽取 -> data/awards/*.jsonl
  //   4. 去重 / 按赛道与年份索引
  console.log("crawl-awards: scaffold only, implement in W1.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
