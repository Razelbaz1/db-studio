# המיילים של RowdyQL

שלוש תבניות מוכנות להדבקה ב-Supabase. תצוגה מקדימה: לפתוח את `preview.html` בדפדפן (לבנות מחדש: `node tools/emailpreview.js`).

| תבנית ב-Supabase | קובץ | נושא (Subject) |
|---|---|---|
| Confirm signup | `confirm_signup.html` | ברוכים הבאים ל-RowdyQL: אישור האימייל |
| Reset password | `reset_password.html` | איפוס הסיסמה ל-RowdyQL |
| Reauthentication | `reauthentication.html` | הקוד לשינוי הסיסמה ב-RowdyQL |

## הדבקה
Supabase → Authentication → Emails → Templates. בוחרים תבנית, מדביקים את הנושא, ואת כל תוכן הקובץ בגוף ההודעה (Message body), ושומרים.
הלוגו נטען מ-`https://rowdyql.com/email-logo.png` (הקובץ בשורש הריפו, נוצר ב-`node tools/emaillogo.js`). הברכה בשם הפרטי מגיעה מ-`first_name` שנשמר בהרשמה.

## שם השולח: RowdyQL
שירות המייל המובנה של Supabase לא מאפשר לשנות את השולח, אז צריך SMTP משלנו. ההמלצה: Resend (יש תוכנית חינמית).
1. נרשמים ב-resend.com, ואז Domains → Add domain → `rowdyql.com`.
2. ב-Cloudflare → DNS מוסיפים את הרשומות ש-Resend מציג, בדיוק כמו שהן. רשומת CNAME, אם יש, מסמנים DNS only (ענן אפור). הרשומות האלה לא משפיעות על האתר. מחכים ל-Verified.
3. ב-Resend → API Keys → Create (Sending access).
4. ב-Supabase → Authentication → Emails → SMTP Settings → Enable custom SMTP:
   - Sender email: `noreply@rowdyql.com`
   - Sender name: `RowdyQL`
   - Host: `smtp.resend.com` · Port: `465` · Username: `resend` · Password: ה-API key
5. ב-Authentication → Rate Limits בודקים את מגבלת המיילים לשעה ומתאימים למספר הנרשמים.
6. בודקים: הרשמה עם אימייל חדש, ו"שכחתי סיסמה" בחלון הכניסה.
