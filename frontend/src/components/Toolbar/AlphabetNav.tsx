import { useTranslation } from 'react-i18next';
import styles from './AlphabetNav.module.scss';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface AlphabetNavProps {
  activeLetter: string;
  onChange: (letter: string) => void;
}

export function AlphabetNav({ activeLetter, onChange }: AlphabetNavProps) {
  const { t } = useTranslation();

  return (
    <div className={styles['alphabet-nav']}>
      <button
        type="button"
        className={`${styles['alphabet-nav__letter']} ${!activeLetter ? styles['alphabet-nav__letter--active'] : ''}`}
        onClick={() => onChange('')}
      >
        {t('alphabet.all')}
      </button>
      {LETTERS.map((letter) => (
        <button
          key={letter}
          type="button"
          className={`${styles['alphabet-nav__letter']} ${
            activeLetter === letter ? styles['alphabet-nav__letter--active'] : ''
          }`}
          onClick={() => onChange(letter)}
        >
          {letter}
        </button>
      ))}
    </div>
  );
}
