/**
 * Redux Hooks
 * 提供类型化的 Redux hooks
 */

import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './index';

/**
 * 类型化的 useDispatch hook
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * 类型化的 useSelector hook
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;