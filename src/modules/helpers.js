// @flow
import { isValidElement } from 'react';
import { createPortal } from 'react-dom';
import ExecutionEnvironment from 'exenv';
import is from 'is-lite';

export const { canUseDOM } = ExecutionEnvironment;
export const isReact16 = createPortal !== undefined;

/**
 * Get the current browser
 *
 * @param {string} userAgent
 *
 * @returns {String}
 */
export function getBrowser(userAgent: string = navigator.userAgent): string {
  let browser = userAgent;

  if (typeof window === 'undefined') {
    browser = 'node';
  } else if (document.documentMode) {
    browser = 'ie';
  } else if (/Edge/.test(userAgent)) {
    browser = 'edge';
  }
  // Opera 8.0+
  else if (Boolean(window.opera) || userAgent.indexOf(' OPR/') >= 0) {
    browser = 'opera';
  }
  // Firefox 1.0+
  else if (typeof window.InstallTrigger !== 'undefined') {
    browser = 'firefox';
  }
  // Safari (and Chrome iOS, Firefox iOS)
  else if (/(Version\/([0-9._]+).*Safari|CriOS|FxiOS| Mobile\/)/.test(userAgent)) {
    browser = 'safari';
  }
  // Chrome 1+
  else if (window.chrome) {
    browser = 'chrome';
  }

  return browser;
}

/**
 * Get the toString Object type
 * @param {*} value
 * @returns {string}
 */
export function getObjectType(value: any): string {
  return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
}

/**
 * Get text from React components
 *
 * @param {*} root
 *
 * @returns {string}
 */
export function getText(root: any): string {
  const content = [];

  const recurse = child => {
    /* istanbul ignore else */
    if (typeof child === 'string' || typeof child === 'number') {
      content.push(child);
    } else if (Array.isArray(child)) {
      child.forEach(c => recurse(c));
    } else if (child && child.props) {
      const { children } = child.props;

      if (Array.isArray(children)) {
        children.forEach(c => recurse(c));
      } else {
        recurse(children);
      }
    }
  };

  recurse(root);

  return content.join(' ').trim();
}

export function hasOwnProperty(value: Object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

export function hasValidKeys(value: Object, keys: Array<any>): boolean {
  if (!is.plainObject(value) || !is.array(keys)) {
    return false;
  }

  return Object.keys(value).every(d => keys.includes(d));
}

/**
 * Convert hex to RGB
 *
 * @param {string} hex
 * @returns {Array}
 */
export function hexToRGB(hex: string): Array<number> {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const properHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(properHex);
  return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [];
}

/**
 * Decide if the step shouldn't skip the beacon
 * @param {Object} step
 *
 * @returns {boolean}
 */
export function hideBeacon(step: Object): boolean {
  return step.disableBeacon || step.placement === 'center';
}

/**
 * Compare if two variables are equal
 *
 * @param {*} left
 * @param {*} right
 *
 * @returns {boolean}
 */
export function isEqual(left: any, right: any): boolean {
  let type;
  const hasReactElement = isValidElement(left) || isValidElement(right);
  const hasUndefined = is.undefined(left) || is.undefined(right);

  if (getObjectType(left) !== getObjectType(right) || hasReactElement || hasUndefined) {
    return false;
  }

  if (is.domElement(left)) {
    return left.isSameNode(right);
  }

  if (is.number(left)) {
    return left === right;
  }

  if (is.function(left)) {
    return left.toString() === right.toString();
  }

  for (const key in left) {
    /* istanbul ignore else */
    if (hasOwnProperty(left, key)) {
      if (typeof left[key] === 'undefined' || typeof right[key] === 'undefined') {
        return false;
      }

      type = getObjectType(left[key]);

      if (['object', 'array'].includes(type) && isEqual(left[key], right[key])) {
        continue;
      }

      if (type === 'function' && isEqual(left[key], right[key])) {
        continue;
      }

      if (left[key] !== right[key]) {
        return false;
      }
    }
  }

  for (const p in right) {
    /* istanbul ignore else */
    if (hasOwnProperty(right, p)) {
      if (typeof left[p] === 'undefined') {
        return false;
      }
    }
  }

  return true;
}

/**
 * Detect legacy browsers
 *
 * @returns {boolean}
 */
export function isLegacy(): boolean {
  return !['chrome', 'safari', 'firefox', 'opera'].includes(getBrowser());
}

/**
 * Log method calls if debug is enabled
 *
 * @private
 * @param {Object}       arg
 * @param {string}       arg.title    - The title the logger was called from
 * @param {Object|Array} [arg.data]   - The data to be logged
 * @param {boolean}      [arg.warn]  - If true, the message will be a warning
 * @param {boolean}      [arg.debug] - Nothing will be logged unless debug is true
 */
export function log({ title, data, warn = false, debug = false }: Object) {
  /* eslint-disable no-console */
  const logFn = warn ? console.warn || console.error : console.log;

  if (debug) {
    if (title && data) {
      console.groupCollapsed(
        `%creact-joyride: ${title}`,
        'color: #ff0044; font-weight: bold; font-size: 12px;',
      );

      if (Array.isArray(data)) {
        data.forEach(d => {
          if (is.plainObject(d) && d.key) {
            logFn.apply(console, [d.key, d.value]);
          } else {
            logFn.apply(console, [d]);
          }
        });
      } else {
        logFn.apply(console, [data]);
      }

      console.groupEnd();
    } else {
      console.error('Missing title or data props');
    }
  }
  /* eslint-enable */
}

/**
 * Returns bounding rect of elements inside
 *
 * @public
 * @param {Object}       elements
 *
 * @returns {Object}
 */
export function getBoundingElementsRect(
  elements: HTMLElement[],
): { top: number, left: number, width: number, height: number } {
  if (elements.length === 0) {
    return {};
  }

  const [firstElement, ...restElements] = elements;
  const rect = firstElement.getBoundingClientRect();
  const left = rect.left + window.scrollX;
  const top = rect.top + window.scrollY;
  const width = firstElement.offsetWidth;
  const height = firstElement.offsetHeight;
  const multiTargetRect = {
    left,
    top,
    width,
    height,
  };

  if (restElements.length === 0) return multiTargetRect;

  restElements.forEach(el => {
    const elRect = el.getBoundingClientRect();
    const elRectGlobalLeft = elRect.left + window.scrollX;
    const elRectGlobalTop = elRect.top + window.scrollY;

    multiTargetRect.left > elRectGlobalLeft && (multiTargetRect.left = elRectGlobalLeft);
    multiTargetRect.top > elRectGlobalTop && (multiTargetRect.top = elRectGlobalTop);
    elRectGlobalLeft + el.offsetWidth > multiTargetRect.left + multiTargetRect.width &&
      (multiTargetRect.width = elRectGlobalLeft + el.offsetWidth - multiTargetRect.left);
    elRectGlobalTop + el.offsetHeight > multiTargetRect.top + multiTargetRect.height &&
      (multiTargetRect.height = elRectGlobalTop + el.offsetHeight - multiTargetRect.top);
  });

  return multiTargetRect;
}

/**
 * Returns bounding element rect with window boundary padding
 *
 * @public
 * @param {Object}       elementRect
 * @param {number}       padding
 * @param {number}       spotlightPadding
 *
 * @returns {Object}
 */
export function getBoundingRectWithBoundaryPadding(
  elementRect: { top: number, left: number, width: number, height: number },
  padding: number = 0,
  spotlightPadding: number = 0,
): { top: number, left: number, width: number, height: number } {
  let left = Math.round(elementRect.left - spotlightPadding);
  let top = Math.round(elementRect.top - spotlightPadding);
  const boundaryPaddingOffsetLeft = padding - left;
  const boundaryPaddingOffsetTop = padding - top;
  left = boundaryPaddingOffsetLeft > 0 ? padding : left;
  top = boundaryPaddingOffsetTop > 0 ? padding : top;

  let width = Math.round(elementRect.width + spotlightPadding * 2);
  width = boundaryPaddingOffsetLeft > 0 ? width - boundaryPaddingOffsetLeft : width;
  const right = left + width;
  const boundaryPaddingOffsetRight =
    padding - (((document.body && document.body.offsetWidth) || 0) - right);
  width = boundaryPaddingOffsetRight > 0 ? width - boundaryPaddingOffsetRight : width;

  let height = Math.round(elementRect.height + spotlightPadding * 2);
  height = boundaryPaddingOffsetTop > 0 ? height - boundaryPaddingOffsetTop : height;
  const bottom = top + height;
  const boundaryPaddingOffsetBottom =
    padding - (((document.body && document.body.offsetHeight) || 0) - bottom);
  height = boundaryPaddingOffsetBottom > 0 ? height - boundaryPaddingOffsetBottom : height;

  return { top, left, width, height };
}
