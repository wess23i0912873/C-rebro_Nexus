import { useState, useEffect } from 'react';

/**
 * Hook que sincroniza estado com localStorage.
 * @param {string} key - chave do localStorage
 * @param {*} initialValue - valor inicial se não houver nada salvo
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`useLocalStorage: erro ao ler "${key}"`, error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`useLocalStorage: erro ao salvar "${key}"`, error);
    }
  };

  return [storedValue, setValue];
}
