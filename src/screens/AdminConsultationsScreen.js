import React, { useEffect, useState } from 'react';
import swal from 'sweetalert';
import { fetchMedicinesAsProducts } from '../utils/productsApi';

const AdminConsultationsScreen = () => {
  const [questions, setQuestions] = useState([]);
  const [products, setProducts] = useState([]);
  const [replyOpenFor, setReplyOpenFor] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [recommendation, setRecommendation] = useState('');

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('consultationQuestions') || '[]');
    setQuestions(saved.reverse());

    // load products for recommendation select
    fetchMedicinesAsProducts()
      .then(data => setProducts(data))
      .catch(() => setProducts([]));
  }, []);

  const persist = (list) => {
    // store in original order
    localStorage.setItem('consultationQuestions', JSON.stringify([...list].reverse()));
  };

  const markAnswered = (id) => {
    const updated = questions.map(q => q.id === id ? { ...q, answered: true, answeredAt: new Date().toISOString() } : q);
    setQuestions(updated);
    persist(updated);
    swal('Marked', 'Question marked as answered (demo).', 'success');
  };

  const deleteQuestion = (id) => {
    swal({
      title: 'Delete question?',
      text: 'This will remove the question from demo data.',
      icon: 'warning',
      buttons: true,
      dangerMode: true
    }).then(ok => {
      if (!ok) return;
      const updated = questions.filter(q => q.id !== id);
      setQuestions(updated);
      persist(updated);
      swal('Deleted', 'Question removed.', 'success');
    });
  };

  const openReply = (q) => {
    setReplyOpenFor(q.id);
    setReplyText(q.reply || '');
    setRecommendation(q.recommendation || '');
  };

  const sendReply = () => {
    const updated = questions.map(q => q.id === replyOpenFor ? { ...q, answered: true, answeredAt: new Date().toISOString(), reply: replyText, recommendation } : q);
    setQuestions(updated);
    persist(updated);
    setReplyOpenFor(null);
    setReplyText('');
    setRecommendation('');
    swal('Sent', 'Reply saved and marked as answered (demo).', 'success');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Admin — Consultations</h1>
          <p className="text-gray-600">List of user-submitted consultation questions (demo storage). Use Reply to save an answer and optionally recommend a product.</p>
        </div>

        {questions.length === 0 ? (
          <div className="bg-white p-8 rounded shadow text-center">No consultation questions found.</div>
        ) : (
          <div className="space-y-4">
            {questions.map(q => (
              <div key={q.id} className="bg-white p-4 rounded shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm text-gray-500">{new Date(q.date).toLocaleString()}</div>
                    <div className="text-lg font-semibold mt-1">{q.name} — <span className="text-sm text-gray-600">{q.email}</span></div>
                    <p className="text-gray-700 mt-2">{q.question}</p>
                    {q.reply && (
                      <div className="mt-3 p-3 bg-green-50 border-l-4 border-green-400 rounded">
                        <div className="text-sm text-gray-700 font-semibold">Admin reply:</div>
                        <div className="text-gray-800 mt-1">{q.reply}</div>
                        {q.recommendation && <div className="mt-2 text-sm text-blue-700">Recommended: {q.recommendation}</div>}
                        {q.answered && <div className="mt-2 text-sm text-green-700">Answered at: {new Date(q.answeredAt).toLocaleString()}</div>}
                      </div>
                    )}
                    {q.answered && !q.reply && <div className="mt-2 text-sm text-green-700">Marked answered at {new Date(q.answeredAt).toLocaleString()}</div>}
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <button onClick={() => openReply(q)} className="bg-blue-600 text-white px-4 py-2 rounded">Reply</button>
                    {!q.answered && <button onClick={() => markAnswered(q.id)} className="bg-green-600 text-white px-4 py-2 rounded">Mark Answered</button>}
                    <button onClick={() => deleteQuestion(q.id)} className="bg-red-600 text-white px-4 py-2 rounded">Delete</button>
                  </div>
                </div>
                {/* Reply area inline */}
                {replyOpenFor === q.id && (
                  <div className="mt-4 bg-gray-50 p-4 rounded">
                    <label className="block text-sm font-medium text-gray-700">Reply</label>
                    <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} className="w-full mt-2 p-2 border rounded" rows={4} />

                    <label className="block text-sm font-medium text-gray-700 mt-3">Recommend product (optional)</label>
                    <select value={recommendation} onChange={(e) => setRecommendation(e.target.value)} className="w-full mt-2 p-2 border rounded">
                      <option value="">— No recommendation —</option>
                      {products.map(p => (
                        <option key={p.id} value={p.title}>{p.title}</option>
                      ))}
                    </select>

                    <div className="mt-3 flex gap-2">
                      <button onClick={sendReply} className="bg-blue-700 text-white px-4 py-2 rounded">Send Reply</button>
                      <button onClick={() => setReplyOpenFor(null)} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminConsultationsScreen;
