import { eventBus } from './event-bus';

/**
 * 异步函数防抖处理
 * @description 第一次调用会立即执行实际的异步函数调用和获取结果，其他调用将等待第一次调用完成后，共享同一个结果
 * @param key 用于标识异步任务的键值
 * @param asyncFunc 需要防抖的异步函数，返回一个 Promise 对象
 * @returns Promise 对象，当异步任务完成时，返回该任务的结果；如果任务失败，将抛出错误
 */
export const asyncDebounce = (key, asyncFunc) => {
  !eventBus.has(key) && asyncFunc().then((result) => {
    eventBus.emit(key, { fulfilled: result });
    eventBus.delete(key);
  }).catch((error) => {
    eventBus.emit(key, { rejected: error });
    eventBus.delete(key);
  });
  return new Promise((resolve, reject) => eventBus.on(key, ({ fulfilled, rejected }) => (rejected ? reject(rejected) : resolve(fulfilled))));
};

/**
 * 合并多个对象的属性到目标对象
 * @description 遍历每个源对象的属性，将其复制到目标对象中。如果目标对象已存在相同属性，将被源对象的属性覆盖
 * @param target 目标对象，将接收合并后的属性
 * @param sources 多个源对象，包含需要合并的属性
 * @returns 合并后的目标对象
 */
export const merge = (target, ...sources) => Object.assign(target, ...sources);

/**
 * 深拷贝对象
 * @description 创建一个新对象，将原始对象的所有属性递归复制到新对象中。新对象与原始对象互不影响
 * @param obj 要深拷贝的对象
 * @returns 深拷贝后的新对象
 */
export const cloneDeep = obj => JSON.parse(JSON.stringify(obj));

/**
 * 判断值是否为字符串
 * @description 检查给定值是否为字符串类型
 * @param value 要检查的值
 * @returns 如果值为字符串类型，则返回 true；否则返回 false
 */
export const isString = value => typeof value === 'string';

/**
 * 判断值是否为数组
 * @description 检查给定值是否为数组类型
 * @param value 要检查的值
 * @returns 如果值为数组类型，则返回 true；否则返回 false
 */
export const isArray = value => Array.isArray(value);

/**
 * 判断值是否为对象
 * @description 检查给定值是否为对象类型（非数组、null）
 * @param value 要检查的值
 * @returns 如果值为对象类型，则返回 true；否则返回 false
 */
export const isObject = value => value !== null && typeof value === 'object' && !isArray(value);

/**
 * 解析JSON字符串为数组
 * @description 尝试将给定的JSON字符串解析为数组。如果解析失败，返回空数组
 * @param jsonStr 要解析的JSON字符串
 * @returns {Array} 解析后的数组；如果解析失败，返回空数组
 */
export const parseJsonToArray = (jsonStr) => {
  try {
    return JSON.parse(jsonStr) ?? [];
  }
  catch (error) {
    console.error('解析JSON字符串为数组时出错:', error);
    return [];
  }
};
