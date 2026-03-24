import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, CheckCircle, AlertTriangle, Film, Plus, ArrowLeft, Loader2, X, ShieldX } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';

const ADMIN_EMAIL = 'zaid199660@gmail.com';
import SEO from '../components/SEO';

const LEVELS = ['A1', 'A2', 'B1', 'B2'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const AdminVideosPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('');
  const [enFile, setEnFile] = useState(null);
  const [arFile, setArFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [enProgress, setEnProgress] = useState(0);
  const [arProgress, setArProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const enInputRef = useRef(null);
  const arInputRef = useRef(null);

  const validateFile = (file) => {
    if (!file) return null;
    if (file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" exceeds 100MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB)`;
    }
    if (!file.type.startsWith('video/')) {
      return `File "${file.name}" is not a video file`;
    }
    return null;
  };

  const uploadFile = async (file, path, onProgress) => {
    // Supabase JS client doesn't expose XHR progress, so we simulate progress
    // by setting intermediate states and then completing
    onProgress(10);

    const { error: uploadError } = await supabase.storage
      .from('video-library')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) throw uploadError;
    onProgress(100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate
    if (!title.trim() || !description.trim() || !level || !enFile) {
      setError('Please fill in all required fields and select an English video.');
      return;
    }

    const enError = validateFile(enFile);
    if (enError) { setError(enError); return; }

    if (arFile) {
      const arError = validateFile(arFile);
      if (arError) { setError(arError); return; }
    }

    const folder = slugify(title.trim());
    if (!folder) {
      setError('Title must contain at least one alphanumeric character.');
      return;
    }

    setUploading(true);
    setEnProgress(0);
    setArProgress(0);

    try {
      // Upload English video
      const enPath = `${folder}/video-en.mp4`;
      await uploadFile(enFile, enPath, setEnProgress);

      // Upload Arabic video if provided
      let arPath = null;
      if (arFile) {
        arPath = `${folder}/video-ar.mp4`;
        await uploadFile(arFile, arPath, setArProgress);
      }

      // Insert into database
      const { data, error: dbError } = await supabase
        .from('video_library')
        .insert({
          title: title.trim(),
          description: description.trim(),
          level,
          audio_url: enPath,
          audio_url_ar: arPath,
          published: true,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setSuccess({ id: data.id, title: data.title });

      // Reset form
      setTitle('');
      setDescription('');
      setLevel('');
      setEnFile(null);
      setArFile(null);
      if (enInputRef.current) enInputRef.current.value = '';
      if (arInputRef.current) arInputRef.current.value = '';
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload video. Please try again.');
    } finally {
      setUploading(false);
      setEnProgress(0);
      setArProgress(0);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pt-20 pb-16 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
            <ShieldX className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-800 mb-2">Access Denied</h1>
          <p className="text-slate-500 mb-6">You don't have permission to access this page.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-semibold shadow-lg shadow-rose-500/25 hover:shadow-xl transition-all"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pt-20 pb-16">
      <SEO title="Admin: Add Video" path="/admin/videos" />
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Back */}
        <Link
          to="/video-library"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          Back to Video Library
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-rose-400 to-purple-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Film className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-800">
                Add New Video
              </h1>
              <p className="text-sm text-slate-500">Upload a video to the library</p>
            </div>
          </div>
        </motion.div>

        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-5"
          >
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-800">Video uploaded successfully!</p>
                <p className="text-sm text-green-700 mt-1">"{success.title}" is now live in the video library.</p>
                <div className="flex gap-3 mt-3">
                  <Link
                    to={`/video-library/${success.id}`}
                    className="text-sm font-semibold text-green-700 hover:text-green-800 underline underline-offset-2"
                  >
                    View Video
                  </Link>
                  <button
                    onClick={() => setSuccess(null)}
                    className="text-sm font-semibold text-green-700 hover:text-green-800 underline underline-offset-2"
                  >
                    Add Another Video
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-5"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div className="p-6 sm:p-8 space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-slate-700 mb-2">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. German Alphabet & Rules"
                disabled={uploading}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all disabled:opacity-50"
              />
              {title.trim() && (
                <p className="mt-1.5 text-xs text-slate-400">
                  Folder: <span className="font-mono">{slugify(title.trim()) || '—'}</span>
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-2">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Learn the German alphabet and pronunciation rules"
                rows={3}
                disabled={uploading}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all resize-none disabled:opacity-50"
              />
            </div>

            {/* Level */}
            <div>
              <label htmlFor="level" className="block text-sm font-semibold text-slate-700 mb-2">
                Level <span className="text-red-400">*</span>
              </label>
              <select
                id="level"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                disabled={uploading}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all disabled:opacity-50"
              >
                <option value="">Select a level</option>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            {/* English Video */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                English Video <span className="text-red-400">*</span>
              </label>
              <div
                onClick={() => !uploading && enInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  enFile
                    ? 'border-green-300 bg-green-50'
                    : 'border-slate-200 bg-slate-50 hover:border-rose-300 hover:bg-rose-50/50'
                } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
              >
                <input
                  ref={enInputRef}
                  type="file"
                  accept="video/mp4,video/*"
                  onChange={(e) => setEnFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                {enFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">{enFile.name}</span>
                    <span className="text-xs text-green-600">({(enFile.size / 1024 / 1024).toFixed(1)}MB)</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Click to select English video (.mp4)</p>
                    <p className="text-xs text-slate-400 mt-1">Max 100MB</p>
                  </>
                )}
              </div>
              {uploading && enProgress > 0 && (
                <div className="mt-2">
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${enProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{enProgress < 100 ? 'Uploading...' : 'Done'}</p>
                </div>
              )}
            </div>

            {/* Arabic Video */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Arabic Video <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <div
                onClick={() => !uploading && arInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  arFile
                    ? 'border-green-300 bg-green-50'
                    : 'border-slate-200 bg-slate-50 hover:border-rose-300 hover:bg-rose-50/50'
                } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
              >
                <input
                  ref={arInputRef}
                  type="file"
                  accept="video/mp4,video/*"
                  onChange={(e) => setArFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                {arFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">{arFile.name}</span>
                    <span className="text-xs text-green-600">({(arFile.size / 1024 / 1024).toFixed(1)}MB)</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Click to select Arabic video (.mp4)</p>
                    <p className="text-xs text-slate-400 mt-1">Max 100MB</p>
                  </>
                )}
              </div>
              {uploading && arFile && arProgress > 0 && (
                <div className="mt-2">
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${arProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{arProgress < 100 ? 'Uploading...' : 'Done'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="px-6 sm:px-8 py-5 bg-slate-50 border-t border-slate-100">
            <button
              type="submit"
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-semibold shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Add Video
                </>
              )}
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default AdminVideosPage;
