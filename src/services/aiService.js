const FILLERS = ['anu', 'eh', 'ehm', 'umm', 'kayak', 'gitu', 'kayaknya', 'semacam'];
const TOXIC = ['bodoh', 'goblok', 'tolol', 'sesat', 'sampah', 'jelek'];

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const aiService = {
  evaluateStudentAnswer(caseItem, studentAnswer, material = null) {
    const transcript = (studentAnswer || '').trim();
    const cermin = this.analyzeArgumentStructure(transcript);
    const materi = this.matchMaterialPoints(material, transcript);

    let kekuatan;
    let perbaikan;
    if (cermin.wordCount < 15) {
      kekuatan = 'Gagasan awal sudah terlihat, namun masih sangat ringkas.';
      perbaikan = 'Uraikan klaim pokokmu lebih dalam dengan alasan ("karena...") dan contoh situasi nyata.';
    } else {
      const judul = (caseItem?.judulKasus || 'kasus ini').replace(/[?.!]+$/, '');
      kekuatan = `Argumenmu sudah menyampaikan ${cermin.hasClaim ? 'klaim yang jelas' : 'sudut pandang yang relevan'} tentang “${judul}”.`;
      if (cermin.fillerHits > 3) {
        perbaikan = `Kurangi kata pengisi ("${cermin.detectedFillers.slice(0, 2).join('", "')}") dan tambahkan bukti supaya analisismu lebih meyakinkan.`;
      } else if (!cermin.hasReason) {
        perbaikan = 'Hubungkan klaimmu dengan "karena..." atau "sebab..." supaya alur sebab-akibatnya terbaca runtut.';
      } else {
        perbaikan = 'Pertajam analisismu dengan menimbang sudut pandang pihak yang tidak setuju dan menyertakan data pendukung.';
      }
    }

    return {
      skor: cermin.skorArgumen,
      feedback: `${kekuatan} ${perbaikan}`,
      cermin,
      materi,
    };
  },

  matchMaterialPoints(material, transcript) {
    if (!material) return null;
    const text = (transcript || '').toLowerCase();
    const sumber = material.poinKunci?.length
      ? material.poinKunci
      : (material.deskripsi || '')
          .split(/[.;]\s*/)
          .filter((t) => t.trim().length > 20)
          .map((t) => ({ teks: t.trim() + '.', kata: t.toLowerCase().split(/\W+/).filter((w) => w.length > 6).slice(0, 4) }));
    const poin = sumber.map((p) => ({
      ...p,
      disinggung: (p.kata || []).some((k) => new RegExp(`(^|[^a-z0-9])${escapeRegex(k.toLowerCase())}`, 'i').test(text)),
    }));
    return { id: material.id, judul: material.judul, poin };
  },

  analyzeArgumentStructure(transcript) {
    const text = transcript.trim();
    const words = text.toLowerCase().split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    let fillerHits = 0;
    const detectedFillers = [];
    words.forEach((w) => {
      const clean = w.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');
      if (FILLERS.includes(clean)) {
        fillerHits++;
        if (!detectedFillers.includes(clean)) detectedFillers.push(clean);
      }
    });

    const hasClaim = /menurut saya|saya berpendapat|bagi saya|saya sepakat|saya tidak sepakat|seharusnya|wajib|harus|keliru/i.test(text);
    const hasReason = /karena|sebab|dikarenakan|oleh karena|alasannya|pasalnya|mengingat/i.test(text);
    const hasEvidence = /contohnya|misalnya|seperti|fakta|data|studi|riset|laporan|bukti/i.test(text);

    let score = 70;
    if (wordCount >= 20) score += 5;
    if (wordCount >= 45) score += 5;
    if (hasClaim) score += 7;
    if (hasReason) score += 8;
    if (hasEvidence) score += 10;
    if (fillerHits > 4) score -= 5;

    return {
      skorArgumen: Math.min(Math.max(score, 65), 98),
      clarityScore: Math.max(75, 100 - fillerHits * 4),
      fillerHits,
      detectedFillers,
      hasClaim,
      hasReason,
      hasEvidence,
      wordCount,
    };
  },

  checkModeration(text) {
    const trimmed = text.trim();
    if (trimmed.length < 5) {
      return { allowed: false, message: 'Tanggapan terlalu singkat. Tulis minimal satu kalimat utuh.' };
    }

    const bad = TOXIC.find((w) => trimmed.toLowerCase().includes(w));
    if (bad) {
      return { allowed: false, message: `Ada kata yang kurang pantas ("${bad}"). Kritik gagasannya, bukan orangnya.` };
    }

    const hasReason = /karena|sebab|alasannya|sehingga|mengingat/i.test(trimmed);
    if (!hasReason && trimmed.split(/\s+/).length < 10) {
      return {
        allowed: true,
        hasNudge: true,
        nudgeText: 'Tanggapanmu sudah terkirim. Lain kali coba tambahkan "karena..." dan satu contoh nyata supaya lawan bicaramu ikut berpikir.',
      };
    }

    return { allowed: true, hasNudge: false };
  },

  generateClassSynthesis(posts, kasus) {
    const judul = kasus?.judulKasus ? `“${kasus.judulKasus.replace(/[?.!]+$/, '')}”` : 'topik ini';
    const lengkap = posts.filter((p) => p.kutipan?.bukti?.length).length;
    return {
      titikTemu: `Ada ${posts.length} pendapat yang masuk tentang ${judul}. ${lengkap ? `${lengkap} di antaranya sudah menyertakan bukti.` : 'Sebagian besar belum menyertakan bukti.'}`,
      titikBeda: 'Posisi kelas masih terbagi. Bandingkan alasan dari pendapat yang paling berseberangan di peta posisi.',
      pertanyaanTerbuka: `Bukti apa yang bisa membuat pihak yang tidak setuju berubah pikiran tentang ${judul}?`,
    };
  },
};
