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
  "בכל גבה שאת מעצבת — את מעצבת קצת ביטחון עצמי.",
  "הצלחה זה כשהלקוחה הראשונה של הבוקר חוזרת בערב להראות לחברות שלה.",
  "ריסים ארוכים, מטרות גבוהות יותר.",
  "כל טיפול שאת נותנת — זאת השקעה בעצמך, לא רק בלקוחה.",
  "קפה, מברשת, ומלא אהבה למקצוע — זה כל מה שצריך.",
  "אנחנו לא מוכרות יופי — אנחנו מחזירות חיוך.",
  "היד שמחזיקה פינצטה היא היד שמחזיקה את העסק.",
  "אם הלקוחה יוצאת ומחייכת למראה שלה — הרווחת את היום.",
  "סבלנות עם גבות — סבלנות עם החיים.",
  "הספרות אומרות הכל, אבל החיוך של הלקוחה אומר יותר.",
  "תמיד יש זמן להוסיף עוד טיפה של זוהר.",
  "כשאת אוהבת את העבודה שלך — זה כבר לא נראה כמו עבודה.",
  "כל מספר ביומן — זה אדם אמיתי שסומך עליך.",
  "הרווח הכי גדול שלך הוא הלקוחות שחוזרות בלי לשאול כמה זה עולה.",
  "אישה יפה זה לא הטיפול — זה איך שהיא מרגישה אחריו.",
  "תני להן סיבה לחזור, לא רק לקבוע תור.",
  "בעסק קטן — כל מחווה קטנה היא ענקית.",
  "כל בוקר שאת פותחת את הדלת — מישהי מחכה לשינוי קטן שיעשה לה את היום.",
  "את לא רק נותנת טיפול — את יוצרת רגע של שקט בתוך יום עמוס.",
  "עסק שנבנה מאהבה — לא קורס בקלות.",
  "כל שקל שנכנס היום — הוא תוצאה של מקצועיות שבנית לאורך זמן.",
  "לקוחה מרוצה לא מחפשת השוואות.",
  "הפרטים הקטנים הם מה שהופכים חוויה רגילה לחוויה שזוכרים.",
  "את יודעת שיש לך עסק אמיתי כשהלקוחות שולחות לך חברות.",
  "זמן זה כסף — אבל כשאת עושה מה שאת אוהבת, זה גם שמחה.",
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
    <div className="flex items-start gap-2.5">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <p
        key={index}
        className={`text-base font-semibold leading-snug text-foreground transition-all duration-500 ease-out ${
          visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
        }`}
      >
        {quote}
      </p>
    </div>
  );
}
