import { forEach, map } from 'lodash';
import { Children, ReactElement, cloneElement, useEffect } from 'react';

type StepProps = {
  isActive?: boolean;
  label?: string;
  title?: string;
};

export const Step = ({ isActive, label }: StepProps) => (
  <div
    className={`flex justify-center items-center lg:h-10 h-5 lg:w-10 w-5 rounded-full px-2 py-2 text-[0.5em] lg:text-[0.92em] ${
      isActive ? 'bg-[#063230] border-2 border-[#fff]' : 'bg-[#373b4f]'
    } font-Poppins font-[500]`}
  >
    {label}
  </div>
);

type StepsProps = {
  activeStep?: number;
  children: any;
};

export const Steps = ({ activeStep = 0, children }: StepsProps) => {
  const childrenArray = Children.toArray(children);

  useEffect(() => {
    forEach(childrenArray, (elem, index) => {
      if ((elem as ReactElement<any>).type !== Step) throw new Error(`Invalid child. Only chid of type 'Step' is allowed. Element at index ${index}`);
    });
  }, [childrenArray]);

  return (
    <div className="flex justify-evenly items-center gap-4 w-full">
      {map(childrenArray, (elem, index) => (
        <div className={`flex flex-col justify-center items-center gap-2 ${index < childrenArray.length - 1 ? 'flex-1' : ''}`} key={index}>
          <div className="flex justify-start items-center gap-2 w-full">
            {cloneElement(elem as ReactElement, {
              isActive: index === activeStep,
              label: (elem as ReactElement<any>).props.label || `${index + 1}`
            })}
            {index < childrenArray.length - 1 && (
              <div
                className={`flex h-[2px] ${
                  index === activeStep ? 'border-b border-dashed border-[#E6E6E6] bg-transparent' : 'bg-[#808080]'
                } w-full float-right`}
              ></div>
            )}
          </div>
          {(elem as ReactElement<any>).props.title && (
            <div className="flex justify-start items-center w-full">
              <span
                className={`font-Syne font-[500] ${index === activeStep ? 'text-[#fff]' : 'text-[#aeaeae]'} text-[0.5em] lg:text-[0.9em] capitalize `}
              >
                {(elem as ReactElement<any>).props.title}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
