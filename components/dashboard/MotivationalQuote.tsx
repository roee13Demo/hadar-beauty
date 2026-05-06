"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

/**
 * Rotating Hebrew quotes shown at the top of the dashboard.
 * Mix of motivational lines and light/funny one-liners about the
 * beauty business. Cycles automatically every ~7 seconds with a
 * gentle fade-and-slide transition.
 */

const QUOTES: string[] = [
  "בכל גבה שאת מעצבת - את מעצבת קצת בטחון עצמי.",
  "הצלחה זה כשהלקוחה הראשונה של הבוקר חוזרת בערב להראות לחברות שלה.",
  "ריסים ארוכים, מטרות גבוהות יותר.",
  "כל טיפול שאת נותנת - זאת השקעה בעצמך, לא רק בלקוחה.",
  "קפה, מברשת, ומלא אהבה למקצוע - זה כל מה שצריך.",
  "אנחנו לא מוכרות יופי - אנחנו מחזירות חיוך.",
  "היד שמחזיקה פינצטה היא היד שמחזיקה את העסק.",
  "אם הלקוחה יוצאת ומחייכת למראה שלה - הרווחת את היום.",
  "סבלנות עם גבות - סבלנות עם החיים.",
  "הספרות אומרות הכל, אבל החיוך של הלקוחה אומר יותר.",
  "תמיד יש זמן להוסיף עוד טיפה של זוהר.",
  "כשאת אוהבת את העבודה שלך - זה כבר לא נראה כמו עבודה.",
  "הגבולות של היום הם המתחת של מחר.",
  "כל מספר ביומן - זה אדם אמיתי שסומך עליך.",
  "הרווח הכי גדול שלך זה הלקוחות הקבועות.",
  "קצת סבון, קצת אור, והרבה תשומת לב לפרטים.",
  "אישה יפה זה לא הטיפול - זה איך שהיא מרגישה אחריו.",
  "תני להן סיבה לחזור, לא רק לקבוע תור.",
  "בעסק קטן - כל מחווה קטנה היא ענקית.",
];

const ROTATION_MS = 7000;

export function MotivationalQuote() {
  // Deterministic SSR value (0); randomize on mount to avoid hydration mismatch.
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setIndex(Math.floor(Math.random() * QUOTES.length));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out, swap quote, fade in
      setVisible(false);
      const fadeOut = setTimeout(() => {
        setIndex((i) => (i + 1) % QUOTES.length);
        setVisible(true);
      }, 350);
      return () => clearTimeout(fadeOut);
    }, ROTATION_MS);
    return () => clearInterval(interval);
  }, []);

  const quote = QUOTES[index];

  return (
    <div className="flex items-center gap-2">
      <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary/70" />
      <p
        key={index}
        className={`text-sm font-medium italic text-foreground/75 transition-all duration-500 ease-out sm:text-sm sm:font-normal sm:text-muted-foreground ${
          visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
        }`}
      >
        {quote}
      </p>
    </div>
  );
}
