import { useState, useCallback } from 'react';

/**
 * Hook que sincroniza estado com localStorage com suporte a atualizações funcionais
 * @param {string} key - chave do localStorage
 * @param {*} initialValue - valor inicial se não houver nada salvo
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        return JSON.parse(item);
      }
      return initialValue;
    } catch (error) {
      console.warn(`useLocalStorage: erro ao ler chave "${key}"`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      setStoredValue((prev) => {
        const valueToStore = value instanceof Function ? value(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
          console.warn(`useLocalStorage: erro ao gravar chave "${key}"`, error);
        }
        return valueToStore;
      });
    } catch (error) {
      console.warn(`useLocalStorage: erro no setter da chave "${key}"`, error);
    }
  }, [key]);

  return [storedValue, setValue];
}
