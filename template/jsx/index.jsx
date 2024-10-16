import React, { useImperativeHandle, forwardRef } from 'react';
import Style from './index.module.less'
import classNames from 'classnames';
const {templateName} = forwardRef((props,ref) => {
 
 useImperativeHandle(ref, () => ({ }));
  return (
    <div className={classNames([Style.{templateName}])}>
     
    </div>
  );
});
{templateName}.displayName = '{templateName}';

export default {templateName};