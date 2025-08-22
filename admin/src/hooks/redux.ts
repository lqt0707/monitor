/**
 * Redux Hooks
 * 提供类型安全的 Redux hooks
 */

import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '../store';

/**
 * 类型安全的 useDispatch hook
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * 类型安全的 useSelector hook
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;