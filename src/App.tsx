import React, { useState } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { Home, Sparkles, ListVideo, Settings, Key, AlertCircle, PlayCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import { cn } from './lib/utils';
import imageCompression from 'browser-image-compression';

function ToastContainer() {
  const { toasts, removeToast } = useAppContext();
  
  if (toasts.length === 0) return null;
  
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <div 
          key={toast.id} 
          className={cn(
            "px-4 py-3 rounded-xl shadow-lg border text-sm font-medium flex items-center justify-between w-72 animate-in slide-in-from-top-2",
            toast.type === 'error' && "bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200",
            toast.type === 'success' && "bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200",
            toast.type === 'info' && "bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200"
          )}
        >
          <span>{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="opacity-50 hover:opacity-100">×</button>
        </div>
      ))}
    </div>
  );
}
// --- API Service Wrapper ---
async function kieApi(endpoint: string, apiKey: string, body?: any, method = 'POST') {
  const targetUrl = `https://api.kie.ai${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };

  const res = await fetch(targetUrl, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || (data.code && data.code !== 200)) {
    const errorMsg = data.msg || data.message || data.error || `${res.status} ${res.statusText} - Kie API Request Failed`;
    throw new Error(errorMsg);
  }
  return data;
}

async function uploadToCloudinary(file: File | Blob) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'magnify');
  const res = await fetch('https://api.cloudinary.com/v1_1/dv4ar152y/auto/upload', {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Upload gagal');
  return data.secure_url;
}

// --- Views ---

function SettingsView() {
  const { kieApiKey, setKieApiKey, isDarkMode, toggleDarkMode, showToast } = useAppContext();
  const [kieInputVal, setKieInputVal] = useState(kieApiKey || '');

  const handleSaveKie = () => {
    setKieApiKey(kieInputVal || '');
    showToast("Kie API Key berhasil disimpan.", "success");
  };

  return (
    <div className="flex flex-col p-6 space-y-6 max-w-lg mx-auto w-full">
      <div className="text-center space-y-2">
        <div className="mx-auto bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400 p-4 rounded-full w-16 h-16 flex items-center justify-center">
          <Key size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Ani Malar Studio</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Gunakan API Key Kie AI Anda untuk akses penuh.</p>
      </div>

      <div className="glass-pink dark:glass-dark p-4 rounded-xl flex gap-3 text-pink-800 dark:text-pink-200 text-sm">
        <AlertCircle className="shrink-0" size={20} />
        <p>Aplikasi ini bersifat Stateless. Kunci API hanya tersimpan aman di browser Anda dan tidak dikirim ke server pihak ketiga manapun.</p>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Kie AI API Key</label>
        <div className="flex gap-2">
          <input 
            type="password"
            value={kieInputVal || ''}
            onChange={(e) => setKieInputVal(e.target.value)}
            placeholder="Bearer token..."
            className="flex-1 px-4 py-3 glass dark:glass-dark border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 transition-shadow dark:text-white"
          />
          <button 
            onClick={handleSaveKie}
            className="bg-pink-500 text-white font-semibold px-6 rounded-xl hover:bg-pink-600 transition shadow-lg shadow-pink-200 dark:shadow-none"
          >
            Save
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mt-6 p-4 glass dark:glass-dark rounded-xl shadow-sm">
        <div className="space-y-1">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">Dark Mode</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Pilih tema tampilan aplikasi</p>
        </div>
        <button 
          onClick={toggleDarkMode}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
            isDarkMode ? "bg-pink-500" : "bg-gray-300 dark:bg-gray-600"
          )}
        >
          <span className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
            isDarkMode ? "translate-x-6" : "translate-x-1"
          )} />
        </button>
      </div>
    </div>
  );
}

function CreateView() {
  const { kieApiKey, addTask, showToast, credits, setCredits } = useAppContext();
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const fetchCredits = React.useCallback(async () => {
    if (!kieApiKey) return;
    try {
      const res = await kieApi('/api/v1/chat/credit', kieApiKey, undefined, 'GET');
      if (res.code === 200) {
        setCredits(res.data);
      }
    } catch (e) {
      console.error("Failed to fetch credits", e);
    }
  }, [kieApiKey, setCredits]);

  React.useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  // Tools Configuration
  const tools = [
    { id: 'happyhorse-ref2video', name: 'HappyHorse Ref-to-Video', desc: 'Video sinematik dengan kontrol multi-karakter dan objek (Up to 9 images).', endpoint: '/api/v1/jobs/createTask', type: 'edit', provider: 'kie', requiresImage: true, multipleImages: true, maxImages: 9, 
      preparePayload: (payload: any, images: string[]) => {
        payload.model = 'happyhorse/reference-to-video';
        payload.callBackUrl = 'playground';
        payload.input = {
          prompt: payload.prompt || '',
          reference_image: images.filter(url => !!url),
          resolution: payload.resolution || '1080p',
          aspect_ratio: payload.aspect_ratio || '16:9',
          duration: payload.duration || 5,
          seed: payload.seed || 0
        };
        // Clean up root level params
        delete payload.prompt;
        delete payload.resolution;
        delete payload.aspect_ratio;
        delete payload.duration;
        delete payload.seed;
      },
      params: [
        { name: 'resolution', label: 'Resolution', type: 'select', options: ['720p', '1080p'], default: '1080p' },
        { name: 'aspect_ratio', label: 'Aspect Ratio', type: 'select', options: ['16:9', '9:16', '1:1', '4:3', '3:4'], default: '16:9' },
        { name: 'duration', label: 'Duration (3-15s)', type: 'number', min: 3, max: 15, step: 1, default: 5 },
        { name: 'seed', label: 'Seed', type: 'number', min: 0, max: 2147483647, default: 0 }
      ]
    },
    { id: 'kling-v3-hybrid', name: 'Kling 3.0 Motion Control Hybrid', desc: 'Sintesis ekspresi & postur (Hybrid)', endpoint: '/api/v1/jobs/createTask', type: 'edit', provider: 'kie', requiresImage: true, requiresVideo: true, promptOptional: true, hidePrompt: true, isHighTraffic: true,
      preparePayload: (payload: any, images: string[], videoUrl: string) => {
        const resolution = payload.resolution || '480p';
        payload.model = 'wan/2-2-animate-move';
        payload.callBackUrl = 'playground';
        payload.input = {
          image_url: images[0],
          video_url: videoUrl,
          resolution: resolution,
          nsfw_checker: false
        };
        // Clean up root level params to comply with Wan API schema
        delete payload.resolution;
        delete payload.prompt;
      },
      params: [
        { name: 'resolution', label: 'Resolution', type: 'select', options: ['480p', '580p', '720p'], default: '480p' }
      ]
    },
    { id: 'grok-imagine-ultra', name: 'Grok Imagine Ultra', desc: 'Sintesis video ultra-realistik dengan emosi mendalam & musik latar otomatis.', endpoint: '/api/v1/jobs/createTask', type: 'edit', provider: 'kie', requiresImage: true, multipleImages: true, maxImages: 2, isHighTraffic: true, promptPlaceholder: 'Deskripsikan adegan sinematik yang Anda bayangkan...',
      preparePayload: (payload: any, images: string[]) => {
        payload.model = 'bytedance/seedance-1.5-pro';
        payload.callBackUrl = 'playground';
        payload.input = {
          prompt: payload.prompt || '',
          input_urls: images.filter(url => !!url),
          aspect_ratio: payload.aspect_ratio || '16:9',
          resolution: payload.resolution || '720p',
          duration: String(payload.duration || '8'),
          fixed_lens: false,
          generate_audio: true,
          nsfw_checker: false
        };
        // Clean up root level params
        delete payload.prompt;
        delete payload.aspect_ratio;
        delete payload.resolution;
        delete payload.duration;
      },
      params: [
        { name: 'aspect_ratio', label: 'Aspect Ratio', type: 'select', options: ['1:1', '4:3', '3:4', '16:9', '9:16', '21:9'], default: '16:9' },
        { name: 'resolution', label: 'Resolution', type: 'select', options: ['480p', '720p', '1080p'], default: '720p' },
        { name: 'duration', label: 'Duration', type: 'select', options: ['4', '8', '12'], default: '8' }
      ]
    },
    { id: 'kling-v2-6', name: 'Kling 2.6 Motion Control', desc: 'Gerak ekspresif dengan detail tinggi (Replace).', endpoint: '/api/v1/jobs/createTask', type: 'edit', provider: 'kie', requiresImage: true, requiresVideo: true, promptOptional: true, hidePrompt: true, isHighTraffic: true,
      preparePayload: (payload: any, images: string[], videoUrl: string) => {
        const resolution = payload.resolution || '480p';
        payload.model = 'wan/2-2-animate-replace';
        payload.callBackUrl = 'playground';
        payload.input = {
          image_url: images[0],
          video_url: videoUrl,
          resolution: resolution,
          nsfw_checker: false
        };
        // Clean up root level params to comply with Wan API schema
        delete payload.resolution;
        delete payload.prompt;
      },
      params: [
        { name: 'resolution', label: 'Resolution', type: 'select', options: ['480p', '580p', '720p'], default: '480p' }
      ]
    },
    { id: 'grok-imagine-i2v', name: 'Grok Imagine Image to Video', desc: 'Kontrol gerak sinematik dari referensi gambar (Up to 7 images).', endpoint: '/api/v1/jobs/createTask', type: 'edit', provider: 'kie', requiresImage: true, multipleImages: true, maxImages: 7, isHighTraffic: true,
      preparePayload: (payload: any, images: string[]) => {
        payload.model = 'grok-imagine/image-to-video';
        payload.callBackUrl = 'playground';
        payload.input = {
          image_urls: images.filter(url => !!url),
          prompt: payload.prompt,
          mode: payload.mode || 'normal',
          duration: payload.duration ? String(payload.duration) : '6',
          resolution: payload.resolution || '480p',
          aspect_ratio: payload.aspect_ratio || '16:9',
          nsfw_checker: false
        };
        // Clean up root level params
        delete payload.mode;
        delete payload.duration;
        delete payload.resolution;
        delete payload.aspect_ratio;
        delete payload.prompt;
      },
      params: [
        { name: 'mode', label: 'Motion Mode', type: 'select', options: ['normal', 'fun', 'spicy'], default: 'normal' },
        { name: 'duration', label: 'Duration (6-30s)', type: 'number', min: 6, max: 30, step: 1, default: 6 },
        { name: 'resolution', label: 'Resolution', type: 'select', options: ['480p', '720p'], default: '480p' },
        { name: 'aspect_ratio', label: 'Aspect Ratio', type: 'select', options: ['16:9', '9:16', '1:1', '3:2', '2:3'], default: '16:9' }
      ]
    }
  ];

  if (activeTool) {
    const defaultTool = tools.find(t => t.id === activeTool)!;
    return <GenerateForm tool={defaultTool} onBack={() => {
      setActiveTool(null);
      fetchCredits();
    }} />;
  }

  return (
    <div className="p-4 pb-24 max-w-xl mx-auto w-full">
      <div className="flex justify-between items-center mb-6 px-2">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Ani Malar Studio</h2>
        <div className="flex items-center gap-2 bg-pink-100 dark:bg-pink-900/40 px-4 py-2 rounded-2xl border border-pink-200 dark:border-pink-800 animate-in fade-in zoom-in group relative">
          <button 
            onClick={(e) => { e.stopPropagation(); fetchCredits(); }} 
            className="absolute -left-2 -top-2 bg-pink-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity transform hover:rotate-180 duration-500"
            title="Refresh Credits"
          >
            <Sparkles size={10} />
          </button>
          <Sparkles size={16} className="text-pink-500" />
          <span className="text-xs font-bold text-pink-700 dark:text-pink-300">
            {credits !== null ? `${credits} Credits` : '---'}
          </span>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-sm font-bold text-pink-500 dark:text-pink-400 uppercase tracking-widest mb-3 px-2">
          ✂️ AI Studio
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {tools.map(tool => (
            <button 
              key={tool.id} 
              onClick={() => setActiveTool(tool.id)}
              className="glass dark:glass-dark p-5 rounded-3xl shadow-sm flex flex-col items-start hover:shadow-lg hover:shadow-pink-100 dark:hover:shadow-none transition-all text-left space-y-3 group relative overflow-hidden"
            >
              {tool.isHighTraffic && (
                <div className="absolute top-3 right-3 bg-red-500 text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-md text-white shadow-sm z-10 animate-pulse">
                  High Traffic
                </div>
              )}
              <div className="bg-pink-50 dark:bg-pink-900/30 p-3 rounded-2xl text-pink-500 dark:text-pink-400 group-hover:bg-pink-500 group-hover:text-white dark:group-hover:text-white transition-colors shadow-sm">
                <Sparkles size={26} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-gray-100 leading-tight">{tool.name}</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-1 font-medium">{tool.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function GenerateForm({ tool, onBack }: { tool: any, onBack: () => void }) {
  const { kieApiKey, addTask, showToast } = useAppContext();
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlStr, setImageUrlStr] = useState('');
  const [videoUrlStr, setVideoUrlStr] = useState('');
  const [audioUrlStr, setAudioUrlStr] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [params, setParams] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    if (tool.params) {
      tool.params.forEach((p: any) => {
        initial[p.name] = p.default;
      });
    }
    return initial;
  });

  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetIndex?: number) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setIsUploading(true);
    showToast(`Sedang memproses gambar...`, "info");
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true
      };
      
      const newImages = await Promise.all(files.map(async (file: File) => {
        const compressedFile = await imageCompression(file, options);
        return await uploadToCloudinary(compressedFile);
      }));

      if (targetIndex !== undefined) {
        setImages(prev => {
          const next = [...prev];
          next[targetIndex] = newImages[0];
          return next;
        });
      } else if (tool.multipleImages) {
        setImages(prev => [...prev, ...newImages].slice(0, tool.maxImages || 9));
      } else {
        setImageUrlStr(newImages[0]);
        setImages([newImages[0]]);
      }
      showToast("Gambar berhasil diproses", "success");
    } catch (error: any) {
      console.log(error);
      showToast(error.message || "Gagal memproses gambar", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    showToast(`Sedang memproses video...`, "info");
    try {
      const url = await uploadToCloudinary(file);
      setVideoUrlStr(url);
      showToast("Video berhasil diproses", "success");
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Gagal memproses video", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    showToast(`Sedang memproses audio...`, "info");
    try {
      const url = await uploadToCloudinary(file);
      setAudioUrlStr(url);
      showToast("Audio berhasil diproses", "success");
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Gagal memproses audio", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!kieApiKey) {
      showToast("Kie AI API Key diperlukan. Silahkan atur di menu Access.", "error");
      return;
    }

    const finalImages = imageUrlStr ? [imageUrlStr] : images;
    const finalVideo = videoUrlStr;
    const finalAudio = audioUrlStr;

    if (tool.requiresImage && finalImages.length === 0) {
      showToast("Gagal: Gambar referensi diperlukan.", "error");
      return;
    }

    if (tool.requiresVideo && !finalVideo) {
      showToast("Gagal: Video referensi diperlukan.", "error");
      return;
    }

    if (tool.requiresAudio && !finalAudio) {
      showToast("Gagal: Audio referensi diperlukan.", "error");
      return;
    }

    if (!prompt && finalImages.length === 0 && !finalVideo && !finalAudio) {
      showToast("Harap isi input yang diperlukan.", "info");
      return;
    }

    setLoading(true);
    try {
      let payload: any = { ...params };
      if (prompt && !tool.hidePrompt) payload.prompt = prompt;
      
      if (tool.preparePayload) {
        tool.preparePayload(payload, finalImages, finalVideo, finalAudio);
      } else {
        if (tool.multipleImages && finalImages.length > 0) {
          payload[tool.payloadField || 'image_urls'] = finalImages;
        } else if (tool.requiresImage && finalImages.length > 0) {
          payload[tool.imageField || tool.payloadField || 'image_url'] = finalImages[0];
        }

        if (tool.requiresVideo && finalVideo) {
          payload[tool.videoField || 'video_url'] = finalVideo;
        }

        if (tool.requiresAudio && finalAudio) {
          payload[tool.audioField || 'uploadUrl'] = finalAudio;
        }
      }

      // Recursive sanitization for payload and nested objects (input)
      const sanitize = (obj: any) => {
        Object.keys(obj).forEach(key => {
          if (obj[key] === undefined || obj[key] === null || obj[key] === '') {
            delete obj[key];
          } else if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
            sanitize(obj[key]);
          }
        });
      };
      
      sanitize(payload);

      const res = await kieApi(tool.endpoint, kieApiKey, payload, 'POST');
      const taskId = res.data?.taskId;
      
      if (taskId) {
        addTask({ id: taskId, type: tool.name, getEndpoint: tool.endpoint, provider: 'kie' });
        showToast("Task berhasil dibuat! Cek di menu Tasks.", "success");
        onBack();
      } else {
        showToast("Gagal membuat task, respon tidak valid", "error");
      }
    } catch (e: any) {
      showToast(e.message || "Gagal menghubungi server", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 pb-24 max-w-xl mx-auto space-y-6">
      <button onClick={onBack} className="text-pink-500 dark:text-pink-400 hover:text-pink-600 dark:hover:text-pink-300 text-sm font-bold flex items-center gap-1 transition-colors">
        &larr; Beranda
      </button>

      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{tool.name}</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{tool.desc}</p>
      </div>

      {(tool.requiresImage || tool.multipleImages) && (
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Referensi Gambar {tool.multipleImages && `(Maks ${tool.maxImages || 9})`}
          </label>
          <div className="glass dark:glass-dark rounded-3xl p-8 text-center hover:bg-white/40 dark:hover:bg-white/5 transition-colors cursor-pointer relative overflow-hidden group">
            <input type="file" accept="image/*" multiple={tool.multipleImages} onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
            {images.length > 0 ? (
              <div className="flex flex-wrap gap-3 justify-center">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-20 h-20 group/img">
                    <img src={img} alt={`Preview ${idx+1}`} className="w-full h-full object-cover rounded-2xl shadow-sm border border-white/50" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-pink-400/60 dark:text-pink-400/40">
                <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-2xl">
                  <ImageIcon size={32} />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest mt-1">Upload Gambar</span>
              </div>
            )}
          </div>

          <div className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest my-1">Atau Gunakan Link</div>
          <input 
            type="text" 
            placeholder="https://... (URL Gambar)" 
            value={imageUrlStr || ''}
            onChange={(e) => setImageUrlStr(e.target.value)}
            className="w-full px-4 py-3 glass dark:glass-dark rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm dark:text-white border-none shadow-sm"
          />
        </div>
      )}

      {tool.requiresVideo && (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Referensi Video</label>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-800/80 transition cursor-pointer relative overflow-hidden group">
            <input type="file" accept="video/mp4,video/quicktime" onChange={handleVideoUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
            {videoUrlStr ? (
              <div className="text-sm text-green-600 font-medium truncate px-4">{videoUrlStr}</div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
                <PlayCircle size={32} />
                <span className="text-sm font-medium px-4">Ketuk untuk upload video (Kie AI Upload)</span>
              </div>
            )}
          </div>
          <div className="text-center text-xs text-gray-400 font-medium my-1">ATAU</div>
          <input 
            type="text" 
            placeholder="https://... (URL Video Publik)" 
            value={videoUrlStr || ''}
            onChange={(e) => setVideoUrlStr(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:text-white"
          />
        </div>
      )}

      {tool.params && tool.params.length > 0 && (
        <div className="space-y-4 glass dark:glass-dark p-6 rounded-3xl shadow-sm">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Settings size={18} className="text-pink-500" /> Pengaturan
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {tool.params.map((p: any) => (
              <div key={p.name} className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{p.label}</label>
                {p.type === 'select' ? (
                  <select 
                    value={params[p.name] ?? ''}
                    onChange={e => setParams({...params, [p.name]: e.target.value})}
                    className="px-4 py-2 bg-white/50 dark:bg-black/20 border border-pink-100 dark:border-pink-900/30 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400"
                  >
                    {p.options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : p.type === 'boolean' ? (
                  <button 
                    onClick={() => setParams({...params, [p.name]: !params[p.name]})}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      params[p.name] ? "bg-pink-500" : "bg-gray-300 dark:bg-gray-700"
                    )}
                  >
                    <span className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      params[p.name] ? "translate-x-6" : "translate-x-1"
                    )} />
                  </button>
                ) : p.type === 'text' ? (
                  <input 
                    type="text"
                    value={params[p.name] ?? ''}
                    onChange={e => setParams({...params, [p.name]: e.target.value})}
                    placeholder={p.optional ? "Opsional" : ""}
                    className="px-4 py-2 bg-white/50 dark:bg-black/20 border border-pink-100 dark:border-pink-900/30 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                ) : p.type === 'number' ? (
                  <input 
                    type="number"
                    min={p.min} max={p.max} step={p.step}
                    value={params[p.name] ?? ''}
                    onChange={e => setParams({...params, [p.name]: e.target.value !== '' ? Number(e.target.value) : undefined})}
                    placeholder={p.optional ? "Opsional" : ""}
                    className="px-4 py-2 bg-white/50 dark:bg-black/20 border border-pink-100 dark:border-pink-900/30 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {!tool.hidePrompt && (
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 px-1">Intruksi Kreatif</label>
            <textarea 
              rows={4}
              value={prompt || ''}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={tool.promptPlaceholder || "Jelaskan secara detail apa yang Anda inginkan..."}
              className="w-full px-5 py-4 glass dark:glass-dark rounded-3xl focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none dark:text-white text-sm shadow-sm border-none transition-shadow"
            />
        </div>
      )}

      <button disabled={loading || isUploading} onClick={handleSubmit} className="w-full bg-pink-500 text-white font-bold py-5 rounded-3xl hover:bg-pink-600 transition-all flex justify-center items-center gap-2 shadow-xl shadow-pink-200 dark:shadow-none hover:scale-[1.02] active:scale-95 disabled:opacity-50">
        {loading ? <Loader2 className="animate-spin" /> : <PlayCircle />}
        Generate
      </button>
    </div>
  );
}

function TaskView() {
  const { tasks, updateTaskStatus, kieApiKey, clearTasks } = useAppContext();

  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isActive = true;
    
    const checkTasks = async () => {
      const pendingTasks = tasks.filter(t => t.status === 'pending');
      if (pendingTasks.length === 0) return;

      for (const task of pendingTasks) {
        try {
            if (task.provider === 'kie') {
              const getUrl = `/api/v1/jobs/recordInfo?taskId=${task.id}`;
              
              const res = await kieApi(getUrl, kieApiKey, undefined, 'GET').catch(e => {
                console.error(`Kie Task poll error for ${task.id}:`, e.message);
                return null;
              });

              if (!res || !res.data) continue;

              const state = res.data.state;
              if (state === 'success') {
                let resultUrl = '';
                try {
                  const resultObj = JSON.parse(res.data.resultJson);
                  resultUrl = resultObj.resultUrls?.[0] || '';
                } catch (e) {
                  console.error("Failed to parse resultJson from Kie", e);
                }
                updateTaskStatus(task.id, 'completed', resultUrl);
              } else if (state === 'fail') {
                updateTaskStatus(task.id, 'failed', undefined, res.data.failMsg || 'Generation failed');
              }
            }
        } catch (e) {
          console.error(`Task check failed for ${task.id}`, e);
        }
      }
      
      if (isActive) {
        timeoutId = setTimeout(checkTasks, 5000);
      }
    };

    checkTasks();

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [tasks, kieApiKey, updateTaskStatus]);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center space-y-4 pt-24">
        <ListVideo size={48} className="text-gray-300 dark:text-gray-600" />
        <p className="text-gray-500 dark:text-gray-400">Belum ada history. Mulai generate video Anda!</p>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 max-w-xl mx-auto w-full">
      <div className="flex justify-between items-center mb-6 px-2">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Riwayat Task</h2>
        <button 
          onClick={() => {
            if (window.confirm('Hapus semua riwayat task?')) {
              clearTasks();
            }
          }}
          className="text-[10px] text-red-500 hover:text-red-600 font-bold bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-full uppercase tracking-widest transition-colors"
        >
          Bersihkan
        </button>
      </div>
      <div className="space-y-4">
        {tasks.map(t => (
          <div key={t.id} className="glass dark:glass-dark p-5 rounded-3xl shadow-sm flex flex-col gap-3 transition-all hover:shadow-md">
            <div className="flex justify-between items-center">
              <span className="font-black text-gray-900 dark:text-gray-100 text-[10px] uppercase tracking-widest px-3 py-1 bg-pink-50 dark:bg-pink-900/20 rounded-full text-pink-600 dark:text-pink-400">{t.type}</span>
              <span className={cn(
                "text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest",
                t.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                t.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              )}>
                {t.status}
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] text-gray-400 font-medium tracking-tight">ID: {t.id}</div>
              <div className="text-[10px] text-gray-400 font-medium tracking-tight">Created: {new Date(t.createdAt).toLocaleString()}</div>
            </div>
            
            {t.status === 'pending' && (
              <div className="w-full bg-gray-100 dark:bg-gray-700 h-1 rounded-full overflow-hidden mt-1">
                <div className="bg-pink-400 h-full w-1/2 animate-[progress_2s_ease-in-out_infinite] rounded-full" />
              </div>
            )}

            {t.status === 'failed' && t.error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 p-3 rounded-2xl text-[10px] text-red-700 dark:text-red-300 font-medium">
                <p className="font-bold mb-1 uppercase tracking-wider opacity-60">Error Details:</p>
                {t.error}
              </div>
            )}

            {t.status === 'completed' && t.resultUrl && (
              <a href={t.resultUrl} target="_blank" rel="noreferrer" className="mt-2 text-center text-xs bg-pink-500 text-white font-bold py-3 rounded-2xl hover:bg-pink-600 transition-all shadow-lg shadow-pink-100 dark:shadow-none uppercase tracking-widest">
                Unduh Hasil
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Main App Shell ---

function AppContent() {
  const [tab, setTab] = useState<'create' | 'tasks' | 'settings'>('create');

  return (
    <div className="min-h-screen bg-brand-pink dark:bg-gray-950 font-sans text-gray-900 dark:text-gray-100 selection:bg-pink-200 dark:selection:bg-pink-900 transition-colors">
      <ToastContainer />
      <div className="pb-24 pt-4">
        {tab === 'settings' && <SettingsView />}
        {tab === 'create' && <CreateView />}
        {tab === 'tasks' && <TaskView />}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md glass dark:glass-dark rounded-[2.5rem] safe-area-bottom z-50 transition-all shadow-2xl shadow-pink-200/50 dark:shadow-none border border-white/50">
        <div className="flex justify-between px-8 py-3">
          <button 
            onClick={() => setTab('create')}
            className={cn("flex flex-col items-center p-2 rounded-2xl transition-all", tab === 'create' ? "text-pink-500 scale-110" : "text-gray-400 hover:text-pink-300")}
          >
            <Sparkles size={24} />
            <span className="text-[9px] font-black uppercase tracking-widest mt-1">Studio</span>
          </button>
          
          <button 
            onClick={() => setTab('tasks')}
            className={cn("flex flex-col items-center p-2 rounded-2xl transition-all", tab === 'tasks' ? "text-pink-500 scale-110" : "text-gray-400 hover:text-pink-300")}
          >
            <ListVideo size={24} />
            <span className="text-[9px] font-black uppercase tracking-widest mt-1">Queue</span>
          </button>
          
          <button 
            onClick={() => setTab('settings')}
            className={cn("flex flex-col items-center p-2 rounded-2xl transition-all", tab === 'settings' ? "text-pink-500 scale-110" : "text-gray-400 hover:text-pink-300")}
          >
            <Settings size={24} />
            <span className="text-[9px] font-black uppercase tracking-widest mt-1">Access</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

