// Which dropped alternatives each criterion keeps, using the TTS case from
// the dialogue behind issue #133: the inner box is "changed the course"
// (Claude variant), the outer box is "explains conditions, limits, or how
// to repeat" (GPT variant), and items outside both are post-hoc candidates.
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const c = new Canvas();
c.box(10, 10, 400, 160, {});
c.text(22, 32, "条件・限界・再現に関係する案（GPT 版）", { size: 12 });
c.box(30, 48, 360, 62, { dash: "5 4" });
c.text(42, 68, "進路を変えた案（Claude 版）", { size: 12 });
const item = (x: number, y: number, s: string) => {
  c.circle(x, y, 4, {});
  c.text(x + 12, y, s, { size: 12, baseline: "central" });
};
item(52, 92, "既定の CUDA 13.2 ビルド → cu128 に固定");
item(52, 146, "ホスト側のドライバ更新（範囲外ですぐ外れた）");
c.box(10, 186, 400, 44, { dash: "2 3" });
item(32, 208, "VOICEVOX、Fish Speech（Grok の候補。検討の記録なし）");
await writeFile(new URL("../build/fig-alternatives-criterion.svg", import.meta.url),
  c.toString({ label: "捨てた代替案を残す二つの基準の包含関係と、TTS の件の案の位置" }));
