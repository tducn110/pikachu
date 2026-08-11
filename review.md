# Báo cáo Tổng hợp & Review Chi tiết Toàn bộ Changes (Game Pikachu Match-2)

Tài liệu này tổng hợp toàn bộ **Kế hoạch triển khai (Implementation Plan)**, **Chi tiết Code / Diffs của TOÀN BỘ các file đã thay đổi & tạo mới (Comprehensive Changes)** và **Hướng dẫn kiểm thử (Walkthrough)**.

---

## 1. Kế hoạch triển khai (Implementation Plan)

### Mục tiêu
Bổ sung các cơ chế gameplay chuẩn casual/hypergame theo đúng yêu cầu:
1. **Hệ thống Tim & Hồi sinh (Lives & Revive)**:
   - Phát hiện khi người dùng nối sai hình -> Trừ 1 tim ngay lập tức.
   - Khi hết tim (0 tim) -> Hiện `ReviveOverlay` hỏi xem quảng cáo để hồi sinh (cấp lại 1 tim) hay không.
   - Nếu đồng ý xem -> Hồi sinh và tiếp tục chơi. Nếu từ chối -> Chuyển sang màn hình Thua (`LoseOverlay`).
2. **Quảng cáo cho Vật phẩm hỗ trợ (HUD Ads)**:
   - Cả 3 vật phẩm (Gợi ý, Đảo, Bom) được sử dụng **1 lần miễn phí (Free)** trong mỗi ván/level.
   - Từ lần thứ 2 trở đi -> Hiện modal `AdPromptOverlay` yêu cầu xem quảng cáo để kích hoạt vật phẩm.
3. **Nhân đôi điểm số (x2 Score)**:
   - Thêm nút xem quảng cáo `x2 Điểm` tại màn hình tổng kết Thắng (`WinOverlay`) và Thua (`LoseOverlay`).

---

## 2. Chi tiết Toàn bộ Code đã sửa & Tạo mới (All Code Changes & Diffs)

### A. Các Components mới được tạo (New Components)

#### 1. `src/app/components/game/ReviveOverlay.tsx`
[Link file](file:///home/pro/Downloads/intern/onprogress/08_pikachu/src/app/components/game/ReviveOverlay.tsx)
```tsx
import React, { useState } from "react";
import { type UsePairMatchGame } from "../../hooks/usePairMatchGame";

interface ReviveOverlayProps {
  game: UsePairMatchGame;
}

export function ReviveOverlay({ game }: ReviveOverlayProps) {
  const [loading, setLoading] = useState(false);

  const handleWatchAd = () => {
    setLoading(true);
    // Simulate watching an ad
    setTimeout(() => {
      game.revive(1); // Give them 1 life to continue
    }, 1000);
  };

  const handleGiveUp = () => {
    game.setLost();
  };

  return (
    <div className="hyper-modal-backdrop">
      <div className="hyper-modal">
        <h2 className="hyper-modal-title">HẾT TIM!</h2>
        <div className="hyper-modal-content" style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          Bạn đã nối sai quá nhiều lần.<br />
          Xem quảng cáo để hồi 1 tim và chơi tiếp?
        </div>
        
        {loading ? (
          <div style={{ textAlign: "center", marginBottom: "1rem" }}>Đang tải quảng cáo...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <button className="hyper-modal-button" onClick={handleWatchAd}>
              <span className="button-icon">📺</span> Xem Quảng Cáo
            </button>
            <button className="hyper-modal-button" style={{ background: "#ccc" }} onClick={handleGiveUp}>
              Không, Cảm Ơn
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

#### 2. `src/app/components/game/AdPromptOverlay.tsx`
[Link file](file:///home/pro/Downloads/intern/onprogress/08_pikachu/src/app/components/game/AdPromptOverlay.tsx)
```tsx
import React, { useState } from "react";

interface AdPromptOverlayProps {
  itemType: "hint" | "shuffle" | "bomb";
  onConfirm: () => void;
  onCancel: () => void;
}

export function AdPromptOverlay({ itemType, onConfirm, onCancel }: AdPromptOverlayProps) {
  const [loading, setLoading] = useState(false);

  const itemNames = {
    hint: "Gợi ý",
    shuffle: "Đảo bàn",
    bomb: "Phá cặp"
  };

  const handleWatchAd = () => {
    setLoading(true);
    // Simulate watching an ad
    setTimeout(() => {
      onConfirm();
    }, 1000);
  };

  return (
    <div className="hyper-modal-backdrop">
      <div className="hyper-modal">
        <h2 className="hyper-modal-title">HẾT LƯỢT MIỄN PHÍ</h2>
        <div className="hyper-modal-content" style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          Bạn cần xem quảng cáo để sử dụng vật phẩm<br />
          <strong>{itemNames[itemType]}</strong>
        </div>
        
        {loading ? (
          <div style={{ textAlign: "center", marginBottom: "1rem" }}>Đang tải quảng cáo...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <button className="hyper-modal-button" onClick={handleWatchAd}>
              <span className="button-icon">📺</span> Xem Quảng Cáo
            </button>
            <button className="hyper-modal-button" style={{ background: "#ccc" }} onClick={onCancel}>
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### B. Các File được chỉnh sửa (Modified Files Diff)

#### 1. `src/app/hooks/useGameSession.ts`
[Link file](file:///home/pro/Downloads/intern/onprogress/08_pikachu/src/app/hooks/useGameSession.ts)
```diff
@@ -5,2 +5,2 @@
-export type GameStatus = "playing" | "won" | "lost";
+export type GameStatus = "playing" | "won" | "lost" | "revive";

@@ -13,0 +14 @@
+  const [lives, setLives] = useState(3);

@@ -78,0 +80,30 @@
+  const removeLife = useCallback(() => {
+    setLives((l) => {
+      const next = Math.max(0, l - 1);
+      if (next === 0) {
+        setStatus("revive");
+      }
+      return next;
+    });
+  }, []);
+
+  const revive = useCallback((hearts: number) => {
+    setLives(hearts);
+    setStatus("playing");
+  }, []);
+
+  const doubleScore = useCallback(() => {
+    setScore((s) => {
+      const next = s * 2;
+      setStats((prev) => {
+        const updated: ScoreStats = {
+          ...prev,
+          best: Math.max(prev.best, next),
+          last: next,
+        };
+        saveStats(updated);
+        return updated;
+      });
+      return next;
+    });
+  }, []);

@@ -91,0 +124 @@
+    setLives(3);

@@ -101,0 +135 @@
+    lives,
@@ -113,0 +148,3 @@
+    removeLife,
+    revive,
+    doubleScore,
```

#### 2. `src/app/hooks/usePairMatchGame.ts`
[Link file](file:///home/pro/Downloads/intern/onprogress/08_pikachu/src/app/hooks/usePairMatchGame.ts)
```diff
@@ -36,0 +37,2 @@
+  lives: number;
+  usedSupport: { hint: number; shuffle: number; bomb: number };
@@ -46,0 +49,4 @@
+  incrementUsedSupport: (type: "hint" | "shuffle" | "bomb") => void;
+  revive: (hearts: number) => void;
+  doubleScore: () => void;
+  setLost: () => void;

@@ -54,0 +61,5 @@
+  const [usedSupport, setUsedSupport] = useState({ hint: 0, shuffle: 0, bomb: 0 });
+
+  const incrementUsedSupport = useCallback((type: "hint" | "shuffle" | "bomb") => {
+    setUsedSupport(prev => ({ ...prev, [type]: prev[type] + 1 }));
+  }, []);

@@ -126,0 +138 @@
+        session.removeLife();

@@ -183,0 +196 @@
+    setUsedSupport({ hint: 0, shuffle: 0, bomb: 0 });

@@ -193,0 +207 @@
+    setUsedSupport({ hint: 0, shuffle: 0, bomb: 0 });

@@ -265,0 +280 @@
+    lives: session.lives,
@@ -271,0 +287 @@
+    usedSupport,
@@ -280,0 +297,4 @@
+    incrementUsedSupport,
+    revive: session.revive,
+    doubleScore: session.doubleScore,
+    setLost: session.setLost,
```

#### 3. `src/app/components/game/Game.tsx`
[Link file](file:///home/pro/Downloads/intern/onprogress/08_pikachu/src/app/components/game/Game.tsx)
```diff
@@ -12,0 +13,2 @@
+import { ReviveOverlay } from "./ReviveOverlay";
+import { AdPromptOverlay } from "./AdPromptOverlay";

@@ -16,2 +18,16 @@ export function Game() {
   const [showScores, setShowScores] = useState(false);
-  const game = usePairMatchGame({ isPaused: showPause || showScores });
+  const [adPromptItem, setAdPromptItem] = useState<"hint" | "shuffle" | "bomb" | null>(null);
+  const game = usePairMatchGame({ isPaused: showPause || showScores || adPromptItem !== null });
   const boardSize = getBoardSize(game.level);
   const totalPairs = (boardSize.rows * boardSize.cols) / 2;

+  const handleSupportRequest = (type: "hint" | "shuffle" | "bomb", action: () => void) => {
+    if (game.usedSupport[type] > 0) {
+      setAdPromptItem(type);
+    } else {
+      game.incrementUsedSupport(type);
+      action();
+    }
+  };
+
+  const doHint = () => handleSupportRequest("hint", game.hintPair);
+  const doShuffle = () => handleSupportRequest("shuffle", game.shuffleBoard);
+  const doBomb = () => handleSupportRequest("bomb", game.bombPair);

@@ -65,3 +81,3 @@ export function Game() {
-                    <div className="hyper-hearts-panel" aria-label="2 trên 3 lượt">
-                      <HyperIcon name="heart" className="hyper-heart" />
-                      <HyperIcon name="heart" className="hyper-heart" />
-                      <HyperIcon name="heart" className="hyper-heart hyper-heart--empty" />
+                    <div className="hyper-hearts-panel" aria-label={`${game.lives} trên 3 lượt`}>
+                      {[1, 2, 3].map(i => (
+                        <HyperIcon key={i} name="heart" className={`hyper-heart ${i > game.lives ? "hyper-heart--empty" : ""}`} />
+                      ))}

@@ -75,3 +91,3 @@ export function Game() {
-                      <SupportButton iconName="hint" label="Gợi ý" count={3} onClick={game.hintPair} />
-                      <SupportButton iconName="shuffle" label="Đảo" count={3} onClick={game.shuffleBoard} />
-                      <SupportButton iconName="bomb" label="Bom" count={3} onClick={game.bombPair} />
+                      <SupportButton iconName="hint" label="Gợi ý" isFree={game.usedSupport.hint === 0} onClick={doHint} />
+                      <SupportButton iconName="shuffle" label="Đảo" isFree={game.usedSupport.shuffle === 0} onClick={doShuffle} />
+                      <SupportButton iconName="bomb" label="Bom" isFree={game.usedSupport.bomb === 0} onClick={doBomb} />

@@ -111,2 +127,15 @@ export function Game() {
-                <WinOverlay score={game.score} onNextLevel={game.nextLevel} onShowScores={() => setShowScores(true)} />
-              )}
-              {game.status === "lost" && <LoseOverlay score={game.score} onPlayAgain={game.resetGame} />}
+                <WinOverlay score={game.score} onNextLevel={game.nextLevel} onShowScores={() => setShowScores(true)} game={game} />
+              )}
+              {game.status === "lost" && <LoseOverlay score={game.score} onPlayAgain={game.resetGame} game={game} />}
+              {game.status === "revive" && <ReviveOverlay game={game} />}
+              {adPromptItem && (
+                <AdPromptOverlay
+                  itemType={adPromptItem}
+                  onConfirm={() => {
+                    game.incrementUsedSupport(adPromptItem);
+                    if (adPromptItem === "hint") game.hintPair();
+                    if (adPromptItem === "shuffle") game.shuffleBoard();
+                    if (adPromptItem === "bomb") game.bombPair();
+                    setAdPromptItem(null);
+                  }}
+                  onCancel={() => setAdPromptItem(null)}
+                />
+              )}
```

#### 4. `src/app/components/game/WinOverlay.tsx`
[Link file](file:///home/pro/Downloads/intern/onprogress/08_pikachu/src/app/components/game/WinOverlay.tsx)
```diff
@@ -1,4 +1,4 @@
-import React from "react";
+import React, { useState } from "react";
 import { RotateCcw } from "lucide-react";
 import { Mascot } from "./Mascot";
 import { ActionButton } from "./ActionButton";
 import { HyperIcon } from "./hyperUi";
+import { type UsePairMatchGame } from "../../hooks/usePairMatchGame";

 export function WinOverlay({
   score,
   onNextLevel,
   onShowScores,
+  game,
 }: {
   score: number;
   onNextLevel: () => void;
   onShowScores: () => void;
+  game: UsePairMatchGame;
 }) {
+  const [doubleClaimed, setDoubleClaimed] = useState(false);
+  const [loadingAd, setLoadingAd] = useState(false);
+
+  const handleDoubleScore = () => {
+    setLoadingAd(true);
+    setTimeout(() => {
+      game.doubleScore();
+      setDoubleClaimed(true);
+      setLoadingAd(false);
+    }, 1000);
+  };

@@ -35,0 +49,7 @@ export function WinOverlay({
+          {!doubleClaimed && (
+            <ActionButton
+              onClick={handleDoubleScore}
+              icon={<span className="button-icon" style={{ fontSize: "1.2rem" }}>📺</span>}
+              label={loadingAd ? "Đang tải..." : "x2 Điểm"}
+            />
+          )}
```

#### 5. `src/app/components/game/LoseOverlay.tsx`
[Link file](file:///home/pro/Downloads/intern/onprogress/08_pikachu/src/app/components/game/LoseOverlay.tsx)
```diff
@@ -1,4 +1,5 @@
-import React from "react";
+import React, { useState } from "react";
 import { RotateCcw } from "lucide-react";
 import { Mascot } from "./Mascot";
 import { ActionButton } from "./ActionButton";
+import { type UsePairMatchGame } from "../../hooks/usePairMatchGame";

 export function LoseOverlay({
   score,
   onPlayAgain,
+  game,
 }: {
   score: number;
   onPlayAgain: () => void;
+  game: UsePairMatchGame;
 }) {
+  const [doubleClaimed, setDoubleClaimed] = useState(false);
+  const [loadingAd, setLoadingAd] = useState(false);
+
+  const handleDoubleScore = () => {
+    setLoadingAd(true);
+    setTimeout(() => {
+      game.doubleScore();
+      setDoubleClaimed(true);
+      setLoadingAd(false);
+    }, 1000);
+  };

@@ -34,0 +48,7 @@ export function LoseOverlay({
+          {!doubleClaimed && (
+            <ActionButton
+              onClick={handleDoubleScore}
+              icon={<span className="button-icon" style={{ fontSize: "1.2rem" }}>📺</span>}
+              label={loadingAd ? "Đang tải..." : "x2 Điểm"}
+            />
+          )}
```

---

## 3. Hướng dẫn Trải nghiệm & Kiểm thử (Walkthrough)

1. **Hệ thống 3 Tim & Hồi Sinh**:
   - Khi vào ván, bạn có **3 tim**.
   - Cố ý nối sai 3 lần -> Tim giảm về 0 và `ReviveOverlay` xuất hiện.
   - Chọn "Xem Quảng Cáo" -> Được hồi 1 tim và chơi tiếp.
   - Chọn "Không, Cảm Ơn" -> Chuyển sang màn Thua.
2. **Vật phẩm hỗ trợ**:
   - Lần dùng 1: Hiển thị chữ `Free`, ấn là kích hoạt ngay.
   - Lần dùng 2+: Hiển thị chữ `Ads`, ấn vào hiện popup `AdPromptOverlay` yêu cầu xem QC.
3. **x2 Điểm**:
   - Tại màn Thắng hoặc Thua, ấn nút `📺 x2 Điểm` -> Điểm số được nhân 2 lập tức và nút biến mất.

---
*Báo cáo kiểm tra mã nguồn hoàn tất.*
