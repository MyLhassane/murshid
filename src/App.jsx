import React, { useState, useEffect } from 'react';
import VERBS_DATA from './verbs.json';

export default function App() {
  const [progress, setProgress] = useState({});
  const [currentVerb, setCurrentVerb] = useState(null);
  const [currentPronoun, setCurrentPronoun] = useState("");
  const [userInput, setUserInput] = useState("");
  const [currentHint, setCurrentHint] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [sessionPoints, setSessionPoints] = useState(0);

  const pronouns = ["je", "tu", "il", "nous", "vous", "ils"];

  // 1. تحميل تقدم المستخدم من المتصفح عند بدء التطبيق
  useEffect(() => {
    const savedProgress = JSON.parse(localStorage.getItem("murshid_progress")) || {};
    setProgress(savedProgress);
    loadNextVerb(savedProgress);
  }, []);

  // 2. خوارزمية اختيار الفعل التالي (مبنية على التكرار المتباعد)
  const loadNextVerb = (userProgress) => {
    const now = new Date().getTime();
    
    // البحث عن فعل حان موعد مراجعته
    let nextItem = VERBS_DATA.find(v => {
      const p = userProgress[v.id];
      return !p || p.nextReview <= now;
    });

    // إذا لم يوجد شيء للمراجعة الآن، نأخذ الفعل الأقل دراسة
    if (!nextItem) {
      nextItem = VERBS_DATA.sort((a, b) => {
        return (userProgress[a.id]?.stability || 0) - (userProgress[b.id]?.stability || 0);
      })[0];
    }

    setCurrentVerb(nextItem);
    // اختيار ضمير عشوائي لاختباره
    setCurrentPronoun(pronouns[Math.floor(Math.random() * pronouns.length)]);
    
    // إعادة ضبط الواجهة
    setUserInput("");
    setCurrentHint(0);
    setFeedback("");
  };

  // 3. معالجة الإجابة وتحديث الخوارزمية (FSRS-inspired Logic)
  const handleAnswer = () => {
    const correctAnswer = currentVerb.conjugations[currentPronoun];
    
    if (userInput.toLowerCase().trim() === correctAnswer) {
      // حساب الأداء بناءً على التلميحات المستهلكة
      // 0 تلميحات = أداء ممتاز (مضاعف 2)
      // 1 تلميح = أداء جيد (مضاعف 1.5)
      // 2+ تلميحات = أداء ضعيف (مضاعف 1 - لا يزيد الاستقرار)
      let multiplier = 2;
      let pointsEarned = 100;

      if (currentHint === 1) {
        multiplier = 1.5;
        pointsEarned = 70;
      } else if (currentHint >= 2) {
        multiplier = 1.1;
        pointsEarned = 40;
      }

      const currentVerbProgress = progress[currentVerb.id] || { stability: 1 }; // الاستقرار المبدئي: يوم واحد
      const newStability = currentVerbProgress.stability * multiplier;
      
      // حساب الموعد القادم للمراجعة (بالميلي ثانية)
      // الساعات المتبقية = الاستقرار * 24 ساعة
      const nextReviewTime = new Date().getTime() + (newStability * 24 * 60 * 60 * 1000);

      const updatedProgress = {
        ...progress,
        [currentVerb.id]: {
          stability: newStability,
          nextReview: nextReviewTime
        }
      };

      setProgress(updatedProgress);
      localStorage.setItem("murshid_progress", JSON.stringify(updatedProgress));
      setSessionPoints(prev => prev + pointsEarned);
      
      setFeedback(`إجابة صحيحة! (+${pointsEarned} نقطة). سيظهر هذا الفعل مجدداً لاحقاً لتثبيته.`);
      
      // الانتقال للسؤال التالي بعد ثانيتين
      setTimeout(() => loadNextVerb(updatedProgress), 2000);

    } else {
      setFeedback("إجابة غير صحيحة، حاول التركيز أكثر أو استخدم تلميحاً.");
    }
  };

  const showHint = () => {
    if (currentHint < currentVerb.hints.length) {
      setCurrentHint(prev => prev + 1);
    }
  };

  if (!currentVerb) return <div>جاري التحميل...</div>;

  return (

    // واجهة مستخدم بسيطة وجذابة مع التركيز على تجربة المستخدم

    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '500px', margin: '40px auto', padding: '20px', border: '2px solid #2c3e50', borderRadius: '15px', backgroundColor: '#ecf0f1' }}>
      
      {/* رأس الصفحة مع اسم التطبيق وعرض النقاط المكتسبة في الجلسة الحالية */}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ color: '#2c3e50', margin: 0 }}>المرشد المنزلي</h2>
        <div style={{ backgroundColor: '#f1c40f', padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold' }}>
          النقاط: {sessionPoints}
        </div>
      </div>

      {/* عرض الفعل الحالي، مع معناه والزمن، بالإضافة إلى حقل الإدخال للمستخدم */}

      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#34495e' }}>{currentVerb.verb} <span style={{fontSize: '0.8em', color: '#7f8c8d'}}>({currentVerb.meaning})</span></h3>
        <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>الزمن: {currentVerb.tense}</p>

        {/* حقل الإدخال للمستخدم */}

        <div style={{ direction: 'ltr', fontSize: '1.2em', marginBottom: '20px', fontWeight: 'bold' }}>
          {currentPronoun.charAt(0).toUpperCase() + currentPronoun.slice(1)} <input 
            type="text" 
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            style={{ padding: '8px', fontSize: '1em', width: '60%', marginLeft: '10px', borderRadius: '5px', border: '1px solid #bdc3c7' }}
            autoFocus
          />
        </div>

        {/* تلميحات */}

        {currentHint > 0 && (
          <div style={{ backgroundColor: '#e8f8f5', borderRight: '4px solid #1abc9c', padding: '10px', marginBottom: '20px', borderRadius: '4px' }}>
            {currentVerb.hints.slice(0, currentHint).map((h, i) => (
              <p key={i} style={{ margin: '5px 0', color: '#16a085', fontSize: '0.9em' }}>{h}</p>
            ))}
          </div>
        )}

        {/* ازرار الخيارات */}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleAnswer} style={{ flex: 1, padding: '10px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
            تحقق
          </button>
          <button onClick={showHint} disabled={currentHint >= currentVerb.hints.length} style={{ flex: 1, padding: '10px', backgroundColor: currentHint >= currentVerb.hints.length ? '#bdc3c7' : '#e67e22', color: 'white', border: 'none', borderRadius: '5px', cursor: currentHint >= currentVerb.hints.length ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
            أحتاج تلميحاً
          </button>
        </div>

        {/* ردود الفعل */}

        {feedback && (
          <p style={{ marginTop: '15px', padding: '10px', backgroundColor: feedback.includes('صحيحة') ? '#d4efdf' : '#fadbd8', color: feedback.includes('صحيحة') ? '#27ae60' : '#c0392b', borderRadius: '5px', textAlign: 'center' }}>
            {feedback}
          </p>
        )}
      </div>
    </div>
  );
}
