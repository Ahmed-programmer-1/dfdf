/* إعدادات الإشعارات (عامة) — بتتدار من admin.html ← الإشعارات ← الربط والقوالب. المفتاح السري مش هنا أبدًا. */

window.PUSH_CONFIG = {
  "enabled": false,
  "appId": "",
  "templates": {
    "new_episode": { "name": "حلقة جديدة", "heading": "حلقة جديدة في {course} 🎬", "body": "نزلت «{episode}» — شاهدها الآن!" },
    "many_episodes": { "name": "عدّة حلقات جديدة", "heading": "حلقات جديدة في {course} 🎬", "body": "نزل {count} حلقات جديدة — أحدثها «{episode}»" },
    "custom": { "name": "رسالة مخصّصة", "heading": "{course}", "body": "{episode}" }
  }
};
