import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Upload, CheckCircle, AlertTriangle, Film, Plus, ArrowLeft, Loader2, X, ShieldX } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';

const ADMIN_EMAIL = 'zaid199660@gmail.com';
import SEO from '../components/SEO';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Reveal from '../components/ui/Reveal.jsx';

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
      <div className="min-h-screen bg-paper pt-20 pb-16 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="mx-auto mb-6 w-16 h-16 rounded-clay bg-accent-himbeer-wash flex items-center justify-center">
            <ShieldX className="w-8 h-8 text-accent-himbeer-ink" />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink mb-2">Access Denied</h1>
          <p className="text-graphite mb-6">You don't have permission to access this page.</p>
          <Button to="/">
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper pt-20 pb-16">
      <SEO title="Admin: Add Video" path="/admin/videos" />
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Back */}
        <Link
          to="/video-library"
          className="inline-flex items-center gap-2 text-graphite hover:text-ink transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          Back to Video Library
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-clay bg-siegel flex items-center justify-center">
              <Film className="w-6 h-6 text-white" />
            </div>
            <div>
              <Reveal
                as="h1"
                className="font-display text-[1.5625rem] font-semibold leading-tight tracking-[-0.018em] text-ink sm:text-[2.125rem]"
              >
                Add New Video
              </Reveal>
              <p className="text-sm text-graphite">Upload a video to the library</p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <Card tone="limette" className="mb-6 p-5 animate-pop-in">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-accent-limette-ink mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-accent-limette-ink">Video uploaded successfully!</p>
                <p className="text-sm text-accent-limette-ink mt-1">"{success.title}" is now live in the video library.</p>
                <div className="flex gap-3 mt-3">
                  <Link
                    to={`/video-library/${success.id}`}
                    className="text-sm font-bold text-siegel transition-colors hover:text-siegel-deep underline underline-offset-2"
                  >
                    View Video
                  </Link>
                  <button
                    onClick={() => setSuccess(null)}
                    className="text-sm font-bold text-siegel transition-colors hover:text-siegel-deep underline underline-offset-2"
                  >
                    Add Another Video
                  </button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card tone="himbeer" className="mb-6 p-5 animate-pop-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-accent-himbeer-ink mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-accent-himbeer-ink">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-accent-himbeer-ink opacity-70 hover:opacity-100">
                <X size={16} />
              </button>
            </div>
          </Card>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-clay border border-rule overflow-hidden"
        >
          <div className="p-6 sm:p-8 space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-ink mb-2">
                Title <span className="text-accent-himbeer-ink">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. German Alphabet & Rules"
                disabled={uploading}
                className="w-full px-4 py-3 rounded-clay border border-rule bg-paper text-ink placeholder-graphite focus:outline-none focus:ring-2 focus:ring-siegel/20 focus:border-siegel transition-all disabled:opacity-50"
              />
              {title.trim() && (
                <p className="mt-1.5 text-xs text-graphite">
                  Folder: <span className="font-mono">{slugify(title.trim()) || '—'}</span>
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-ink mb-2">
                Description <span className="text-accent-himbeer-ink">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Learn the German alphabet and pronunciation rules"
                rows={3}
                disabled={uploading}
                className="w-full px-4 py-3 rounded-clay border border-rule bg-paper text-ink placeholder-graphite focus:outline-none focus:ring-2 focus:ring-siegel/20 focus:border-siegel transition-all resize-none disabled:opacity-50"
              />
            </div>

            {/* Level */}
            <div>
              <label htmlFor="level" className="block text-sm font-semibold text-ink mb-2">
                Level <span className="text-accent-himbeer-ink">*</span>
              </label>
              <select
                id="level"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                disabled={uploading}
                className="w-full px-4 py-3 rounded-clay border border-rule bg-paper text-ink focus:outline-none focus:ring-2 focus:ring-siegel/20 focus:border-siegel transition-all disabled:opacity-50"
              >
                <option value="">Select a level</option>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            {/* English Video */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">
                English Video <span className="text-accent-himbeer-ink">*</span>
              </label>
              <div
                onClick={() => !uploading && enInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-clay p-6 text-center cursor-pointer transition-all ${
                  enFile
                    ? 'border-accent-limette bg-accent-limette-wash'
                    : 'border-rule bg-paper hover:border-siegel hover:bg-siegel-wash'
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
                    <CheckCircle className="w-5 h-5 text-accent-limette-ink" />
                    <span className="text-sm font-medium text-accent-limette-ink">{enFile.name}</span>
                    <span className="font-data text-[0.8125rem] text-accent-limette-ink">({(enFile.size / 1024 / 1024).toFixed(1)}MB)</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-graphite mx-auto mb-2" />
                    <p className="text-sm text-graphite">Click to select English video (.mp4)</p>
                    <p className="text-xs text-graphite mt-1">Max 100MB</p>
                  </>
                )}
              </div>
              {uploading && enProgress > 0 && (
                <div className="mt-2">
                  <div className="h-1.5 bg-paper-sunk rounded-pill overflow-hidden">
                    <div
                      className="h-full bg-siegel rounded-pill transition-all duration-500"
                      style={{ width: `${enProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-graphite mt-1">{enProgress < 100 ? 'Uploading...' : 'Done'}</p>
                </div>
              )}
            </div>

            {/* Arabic Video */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">
                Arabic Video <span className="text-graphite font-normal">(optional)</span>
              </label>
              <div
                onClick={() => !uploading && arInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-clay p-6 text-center cursor-pointer transition-all ${
                  arFile
                    ? 'border-accent-limette bg-accent-limette-wash'
                    : 'border-rule bg-paper hover:border-siegel hover:bg-siegel-wash'
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
                    <CheckCircle className="w-5 h-5 text-accent-limette-ink" />
                    <span className="text-sm font-medium text-accent-limette-ink">{arFile.name}</span>
                    <span className="font-data text-[0.8125rem] text-accent-limette-ink">({(arFile.size / 1024 / 1024).toFixed(1)}MB)</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-graphite mx-auto mb-2" />
                    <p className="text-sm text-graphite">Click to select Arabic video (.mp4)</p>
                    <p className="text-xs text-graphite mt-1">Max 100MB</p>
                  </>
                )}
              </div>
              {uploading && arFile && arProgress > 0 && (
                <div className="mt-2">
                  <div className="h-1.5 bg-paper-sunk rounded-pill overflow-hidden">
                    <div
                      className="h-full bg-siegel rounded-pill transition-all duration-500"
                      style={{ width: `${arProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-graphite mt-1">{arProgress < 100 ? 'Uploading...' : 'Done'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="px-6 sm:px-8 py-5 bg-paper border-t border-rule">
            <Button type="submit" disabled={uploading} size="lg" className="w-full">
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
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminVideosPage;
