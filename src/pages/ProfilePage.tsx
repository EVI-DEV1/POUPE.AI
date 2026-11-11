import { Check, ImagePlus, Trash2 } from 'lucide-react';
import { type ChangeEvent, type FormEvent, useState } from 'react';

import { PageHero } from '@/components/shared/PageHero';
import { Avatar } from '@/components/ui/Avatar';
import { UIButton } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { AVATAR_COLORS, profileStore, useProfile } from '@/stores';

/** Reduz a foto para 160px antes de salvar (localStorage tem limite de espaço). */
function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const size = 160;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('canvas'));
      const side = Math.min(img.width, img.height);
      ctx.drawImage(
        img,
        (img.width - side) / 2,
        (img.height - side) / 2,
        side,
        side,
        0,
        0,
        size,
        size
      );
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image'));
    };
    img.src = url;
  });
}

export function ProfilePage() {
  const profile = useProfile();
  const [name, setName] = useState(profile.name);
  const [color, setColor] = useState(profile.avatarColor);
  const [image, setImage] = useState(profile.avatarImage);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [imageError, setImageError] = useState('');

  const preview = { name, avatarColor: color, avatarImage: image };

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageError('Escolha um arquivo de imagem.');
      return;
    }
    try {
      setImage(await resizeImage(file));
      setImageError('');
    } catch {
      setImageError('Não foi possível ler essa imagem.');
    }
  };

  const save = (event: FormEvent) => {
    event.preventDefault();
    try {
      profileStore.write({
        name: name.trim().slice(0, 40),
        avatarColor: color,
        avatarImage: image,
      });
      setStatus('saved');
      window.setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl py-2">
      <PageHero
        title="Perfil"
        subtitle="Como o Poupe.ai deve chamar você. Fica salvo apenas neste navegador."
      />

      <Panel>
        <form onSubmit={save} className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Avatar profile={preview} size={88} />
            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
              <label className="bg-secondary-button border-border hover:border-border-strong inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition focus-within:outline-2 focus-within:outline-[#a855f7]">
                <ImagePlus size={16} aria-hidden /> Enviar foto
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => void onFile(e)}
                  className="sr-only"
                />
              </label>
              {image && (
                <UIButton variant="ghost" size="md" icon={Trash2} onClick={() => setImage(null)}>
                  Remover foto
                </UIButton>
              )}
            </div>
          </div>
          {imageError && <p className="text-danger -mt-3 text-sm">{imageError}</p>}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="profile-name" className="text-sm font-medium">
              Nome de exibição
            </label>
            <input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              placeholder="Como você quer ser chamado(a)?"
              className="field"
            />
          </div>

          {!image && (
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Cor do avatar</legend>
              <div className="flex flex-wrap gap-3">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={`Cor ${c}`}
                    aria-pressed={color === c}
                    style={{ background: c }}
                    className="ring-offset-card flex h-9 w-9 items-center justify-center rounded-full text-white ring-offset-2 transition aria-pressed:ring-2 aria-pressed:ring-white"
                  >
                    {color === c && <Check size={16} />}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <div className="flex items-center gap-3">
            <UIButton type="submit">
              {status === 'saved' ? 'Perfil salvo ✓' : 'Salvar perfil'}
            </UIButton>
            {status === 'error' && (
              <p className="text-danger text-sm">Não foi possível salvar (armazenamento cheio?).</p>
            )}
          </div>
        </form>
      </Panel>
    </div>
  );
}
