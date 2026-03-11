import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { courseService, progressService, quizService } from '../services/api';
import { useAuth } from '../context/AuthContext';

function extractYouTubeId(url) {
  if (!url) return null;
  if (url.includes('embed/')) return url.split('embed/')[1].split('?')[0];
  if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0];
  if (url.includes('watch?v=')) return url.split('watch?v=')[1].split('&')[0];
  return null;
}

// ── Quiz Panel ────────────────────────────────────────────────────────────────
function QuizPanel({ lessonId, onClose }) {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [startTime] = useState(Date.now());
  const timerRef = useRef(null);

  useEffect(() => {
    quizService.get(lessonId).then(({ data }) => {
      setQuiz(data);
      setAnswers(new Array(data.questions?.length || 0).fill(-1));
      if (data.time_limit_minutes > 0) setTimeLeft(data.time_limit_minutes * 60);
    }).catch(() => setQuiz(null)).finally(() => setLoading(false));
  }, [lessonId]);

  useEffect(() => {
    if (timeLeft === null || submitted) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, submitted]);

  const handleSubmit = async () => {
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const { data } = await quizService.submit(lessonId, { answers, time_taken_seconds: timeTaken });
    setResult(data);
    setSubmitted(true);
  };

  if (loading) return <div style={{ padding: 24, textAlign: 'center' }}><div className="spinner" style={{ width: 28, height: 28, margin: '0 auto' }} /></div>;
  if (!quiz) return <div style={{ padding: 24, color: 'var(--text-muted)', textAlign: 'center', fontSize: 13 }}>No quiz for this lesson.</div>;

  const allAnswered = answers.every(a => a !== -1);
  const formatTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontWeight: 800, fontSize: 16, fontFamily: 'var(--font-display)' }}>{quiz.title}</h3>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {timeLeft !== null && !submitted && (
            <span style={{ fontSize: 13, fontWeight: 700, color: timeLeft < 60 ? '#ef4444' : 'var(--text-muted)', padding: '4px 10px', background: timeLeft < 60 ? '#ef444422' : 'var(--bg)', borderRadius: 6, border: '1px solid var(--border)' }}>
              ⏱ {formatTime(timeLeft)}
            </span>
          )}
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18 }}>✕</button>
        </div>
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, display: 'flex', gap: 12 }}>
        <span>{quiz.question_count} questions</span>
        <span>Pass: {quiz.pass_score}%</span>
        {quiz.max_attempts > 0 && <span>Attempts: {quiz.attempt_count || 0}/{quiz.max_attempts}</span>}
      </div>

      {submitted && result ? (
        <div>
          <div style={{ textAlign: 'center', padding: '16px 0 20px', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{result.passed ? '🎉' : '😔'}</div>
            <div style={{ fontSize: 36, fontWeight: 800, fontFamily: 'var(--font-display)', color: result.passed ? '#10b981' : '#ef4444', marginBottom: 4 }}>{result.score}%</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{result.correct}/{result.total} correct · Pass: {result.pass_score}%</div>
            <div style={{ marginTop: 12, padding: '6px 16px', display: 'inline-block', borderRadius: 20, fontSize: 13, fontWeight: 700, background: result.passed ? '#10b98122' : '#ef444422', color: result.passed ? '#10b981' : '#ef4444' }}>
              {result.passed ? '✓ Quiz Passed!' : '✗ Not Passed — Try Again'}
            </div>
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {result.results?.map((r, i) => (
              <div key={i} style={{ marginBottom: 14, padding: 12, borderRadius: 8, background: r.is_correct ? '#10b98110' : '#ef444410', border: `1px solid ${r.is_correct ? '#10b98133' : '#ef444433'}` }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  {r.is_correct ? '✓' : '✗'} Q{i + 1}: {r.question_text}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Your answer: <strong style={{ color: r.is_correct ? '#10b981' : '#ef4444' }}>{r.options?.[r.your_answer] || '—'}</strong>
                  {!r.is_correct && <span> · Correct: <strong style={{ color: '#10b981' }}>{r.options?.[r.correct_answer]}</strong></span>}
                </div>
                {r.explanation && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, fontStyle: 'italic' }}>💡 {r.explanation}</div>}
              </div>
            ))}
          </div>
          {!result.passed && (
            <button onClick={() => { setSubmitted(false); setResult(null); setAnswers(new Array(quiz.questions.length).fill(-1)); }}
              style={{ marginTop: 16, padding: '8px 20px', background: 'var(--accent-bright)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, width: '100%' }}>
              Retry Quiz
            </button>
          )}
        </div>
      ) : (
        <div>
          {quiz.questions?.map((q, qi) => (
            <div key={q.id} style={{ marginBottom: 20, padding: 14, background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>
                <span style={{ color: 'var(--accent-bright)', marginRight: 6 }}>{qi + 1}.</span>{q.text}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {q.options?.map((opt, oi) => (
                  <label key={oi} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 12px', borderRadius: 6, border: `1px solid ${answers[qi] === oi ? 'var(--accent-bright)' : 'var(--border)'}`, background: answers[qi] === oi ? 'rgba(99,102,241,.1)' : 'transparent', transition: 'all .1s' }}>
                    <input type="radio" name={`q${qi}`} checked={answers[qi] === oi} onChange={() => setAnswers(a => a.map((v, i) => i === qi ? oi : v))} style={{ accentColor: 'var(--accent-bright)' }} />
                    <span style={{ fontSize: 13 }}>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button onClick={handleSubmit} disabled={!allAnswered}
            style={{ width: '100%', padding: 11, background: allAnswered ? 'var(--accent-bright)' : 'var(--border)', color: allAnswered ? '#fff' : 'var(--text-muted)', border: 'none', borderRadius: 8, cursor: allAnswered ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: 14 }}>
            {allAnswered ? 'Submit Answers' : `Answer all ${quiz.questions?.length} questions to submit`}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main LearnPage ────────────────────────────────────────────────────────────
export default function LearnPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  const [completedLessons, setCompletedLessons] = useState(new Set());

  // Resume video tracking
  const watchStartRef = useRef(null);       // when user started watching this session
  const saveTimerRef = useRef(null);        // periodic auto-save timer
  const currentLessonRef = useRef(null);   // keep ref in sync for cleanup

  // ── Load course ──
  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    courseService.detail(slug).then(({ data }) => {
      setCourse(data);
      if (!data.is_enrolled) { navigate(`/courses/${slug}`); return; }
      const lessons = data.lessons || [];
      const completed = new Set(lessons.filter(l => l.is_completed).map(l => l.id));
      setCompletedLessons(completed);
      // Resume from last incomplete lesson
      const firstIncomplete = lessons.find(l => !l.is_completed) || lessons[0];
      if (firstIncomplete) setCurrentLesson(firstIncomplete);
    }).finally(() => setLoading(false));
  }, [slug, user]);

  // ── Keep ref in sync ──
  useEffect(() => {
    currentLessonRef.current = currentLesson;
  }, [currentLesson]);

  // ── Save position to backend ──
  const savePosition = useCallback(async (lesson, elapsedSeconds) => {
    if (!lesson || lesson.lesson_type === 'text') return;
    try {
      await progressService.savePosition(lesson.id, {
        position_seconds: lesson.last_position_seconds + elapsedSeconds,
        watch_time_seconds: elapsedSeconds,
      });
    } catch { /* silent fail */ }
  }, []);

  // ── Auto-save every 30s while watching ──
  useEffect(() => {
    if (!currentLesson || currentLesson.lesson_type === 'text') {
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
      return;
    }

    watchStartRef.current = Date.now();

    // Auto-save every 30 seconds
    saveTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - (watchStartRef.current || Date.now())) / 1000);
      if (elapsed > 0) savePosition(currentLessonRef.current, elapsed);
    }, 30000);

    return () => {
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
      // Save on lesson change / unmount
      const elapsed = Math.floor((Date.now() - (watchStartRef.current || Date.now())) / 1000);
      if (elapsed > 5) savePosition(currentLessonRef.current, elapsed);
    };
  }, [currentLesson?.id]);

  // ── Cleanup on page leave ──
  useEffect(() => {
    const handleUnload = () => {
      const elapsed = Math.floor((Date.now() - (watchStartRef.current || Date.now())) / 1000);
      if (elapsed > 5 && currentLessonRef.current) {
        // Use sendBeacon for reliable unload saves
        const payload = JSON.stringify({
          position_seconds: (currentLessonRef.current.last_position_seconds || 0) + elapsed,
          watch_time_seconds: elapsed,
        });
        navigator.sendBeacon?.(
          `/api/progress/lessons/${currentLessonRef.current.id}/position/`,
          new Blob([payload], { type: 'application/json' })
        );
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  // ── Mark complete ──
  const handleMarkComplete = async () => {
    if (!currentLesson || completing) return;
    setCompleting(true);
    // Save position before marking complete
    const elapsed = Math.floor((Date.now() - (watchStartRef.current || Date.now())) / 1000);
    if (elapsed > 5) await savePosition(currentLesson, elapsed);
    try {
      await progressService.markComplete(currentLesson.id);
      setCompletedLessons(prev => new Set([...prev, currentLesson.id]));
      const lessons = course.lessons || [];
      const idx = lessons.findIndex(l => l.id === currentLesson.id);
      if (idx < lessons.length - 1) {
        setTimeout(() => handleLessonClick(lessons[idx + 1]), 400);
      }
    } finally { setCompleting(false); }
  };

  // ── Switch lesson ──
  const handleLessonClick = (lesson) => {
    // Save position of current lesson before switching
    if (currentLesson && currentLesson.lesson_type !== 'text') {
      const elapsed = Math.floor((Date.now() - (watchStartRef.current || Date.now())) / 1000);
      if (elapsed > 5) savePosition(currentLesson, elapsed);
    }
    watchStartRef.current = Date.now();
    setCurrentLesson(lesson);
    setShowQuiz(false);
  };

  const progress = course ? Math.round((completedLessons.size / (course.lessons?.length || 1)) * 100) : 0;
  const isCompleted = currentLesson ? completedLessons.has(currentLesson.id) : false;
  const lessons = course?.lessons || [];
  const currentIdx = lessons.findIndex(l => l.id === currentLesson?.id);
  const prevLesson = currentIdx > 0 ? lessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < lessons.length - 1 ? lessons[currentIdx + 1] : null;

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );
  if (!course) return null;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── LEFT: Lesson Sidebar ── */}
      <div style={{
        width: sidebarOpen ? 300 : 0, minWidth: sidebarOpen ? 300 : 0,
        background: 'var(--bg-card)', borderRight: '1px solid var(--border)',
        overflowY: 'auto', transition: 'all .2s', display: 'flex', flexDirection: 'column',
      }}>
        {sidebarOpen && (
          <>
            <div style={{ padding: 16, borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <Link to={`/courses/${slug}`} style={{ fontSize: 11, color: 'var(--accent-bright)', textDecoration: 'none', fontWeight: 600 }}>← Course Details</Link>
              <h2 style={{ fontSize: 14, fontWeight: 700, marginTop: 6, marginBottom: 10, lineHeight: 1.3 }}>{course.title}</h2>
              {/* Progress bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: progress >= 100 ? '#10b981' : 'var(--accent-bright)', borderRadius: 3, transition: 'width .3s' }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>{progress}%</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{completedLessons.size}/{lessons.length} lessons</div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {lessons.map((lesson, i) => {
                const done = completedLessons.has(lesson.id);
                const active = currentLesson?.id === lesson.id;
                return (
                  <div key={lesson.id} onClick={() => handleLessonClick(lesson)}
                    style={{
                      padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 10,
                      background: active ? 'rgba(99,102,241,.12)' : 'transparent',
                      borderLeft: active ? '3px solid var(--accent-bright)' : '3px solid transparent',
                      transition: 'background .1s',
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,.03)'; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                      background: done ? '#10b981' : active ? 'var(--accent-bright)' : 'var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 700,
                    }}>
                      {done ? '✓' : i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lesson.title}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {lesson.lesson_type === 'text' ? '📄' : '▶'} {lesson.duration_minutes ? `${lesson.duration_minutes}m` : ''}
                        {lesson.last_position_seconds > 5 && !done && (
                          <span style={{ color: 'var(--accent-bright)', fontSize: 10, fontWeight: 700 }}>
                            · {Math.floor(lesson.last_position_seconds / 60)}:{String(lesson.last_position_seconds % 60).padStart(2, '0')} saved
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── RIGHT: Video / Content Area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, background: 'var(--bg-card)' }}>
          <button onClick={() => setSidebarOpen(o => !o)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, padding: 4 }}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentLesson?.title}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Lesson {currentIdx + 1} of {lessons.length}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {prevLesson && (
              <button onClick={() => handleLessonClick(prevLesson)}
                style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                ← Prev
              </button>
            )}
            <button onClick={handleMarkComplete} disabled={isCompleted || completing}
              style={{ padding: '6px 14px', borderRadius: 6, border: 'none', cursor: isCompleted ? 'default' : 'pointer', fontSize: 12, fontWeight: 700, background: isCompleted ? '#10b98122' : 'var(--accent-bright)', color: isCompleted ? '#10b981' : '#fff', transition: 'all .15s' }}>
              {isCompleted ? '✓ Completed' : completing ? '...' : 'Mark Complete'}
            </button>
            {nextLesson && (
              <button onClick={() => handleLessonClick(nextLesson)}
                style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                Next →
              </button>
            )}
            <button onClick={() => setShowQuiz(o => !o)}
              style={{ padding: '6px 14px', border: '1px solid var(--border)', borderRadius: 6, background: showQuiz ? 'rgba(99,102,241,.15)' : 'var(--bg)', color: showQuiz ? 'var(--accent-bright)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
              ✏️ Quiz
            </button>
          </div>
        </div>

        {/* Content + quiz split */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {currentLesson ? (
              <>
                {/* VIDEO LESSON */}
                {currentLesson.lesson_type !== 'text' && currentLesson.youtube_url && (
                  <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#000', flexShrink: 0 }}>
                    <iframe
                      key={currentLesson.id}
                      src={(() => {
                        const vid = extractYouTubeId(currentLesson.youtube_embed_url || currentLesson.youtube_url);
                        const startAt = currentLesson.last_position_seconds > 5 ? currentLesson.last_position_seconds : 0;
                        return `https://www.youtube.com/embed/${vid}${startAt ? `?start=${startAt}` : ''}`;
                      })()}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={currentLesson.title}
                    />
                    {currentLesson.last_position_seconds > 5 && (
                      <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,.75)', color: '#fff', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, pointerEvents: 'none' }}>
                        ▶ Resuming from {Math.floor(currentLesson.last_position_seconds / 60)}:{String(currentLesson.last_position_seconds % 60).padStart(2, '0')}
                      </div>
                    )}
                  </div>
                )}

                {/* TEXT LESSON */}
                {currentLesson.lesson_type === 'text' && currentLesson.text_content && (
                  <div style={{ padding: '32px 40px', maxWidth: 720 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, display: 'flex', gap: 6 }}>
                      <span>📄 Text Lesson</span>
                      {currentLesson.duration_minutes > 0 && <span>· {currentLesson.duration_minutes} min read</span>}
                    </div>
                    <div style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                      {currentLesson.text_content}
                    </div>
                  </div>
                )}

                {/* Lesson info */}
                <div style={{ padding: '20px 28px', flex: 1 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: 8 }}>{currentLesson.title}</h2>
                  {currentLesson.description && (
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{currentLesson.description}</p>
                  )}
                  {progress >= 100 && (
                    <div style={{ marginTop: 20, padding: '14px 18px', background: '#10b98122', border: '1px solid #10b98144', borderRadius: 10 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#10b981', marginBottom: 4 }}>🎉 Course Completed!</div>
                      <div style={{ fontSize: 13, color: '#10b981', marginBottom: 10 }}>Congratulations! You've finished all lessons.</div>
                      <Link to={`/certificate/${slug}`} style={{ display: 'inline-block', padding: '7px 16px', background: '#10b981', color: '#fff', borderRadius: 7, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
                        🏆 View Certificate
                      </Link>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Select a lesson to begin
              </div>
            )}
          </div>

          {/* Quiz panel */}
          {showQuiz && currentLesson && (
            <div style={{ width: 380, borderLeft: '1px solid var(--border)', overflowY: 'auto', background: 'var(--bg-card)', flexShrink: 0 }}>
              <QuizPanel lessonId={currentLesson.id} onClose={() => setShowQuiz(false)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
