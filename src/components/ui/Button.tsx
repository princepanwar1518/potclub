import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { buttonClasses, type ButtonSize, type ButtonVariant } from './buttonClasses'

interface CommonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...rest
}: CommonProps & ComponentPropsWithoutRef<'button'>) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...rest} />
}

export function ButtonLink({ variant = 'primary', size = 'md', className, ...rest }: CommonProps & LinkProps) {
  return <Link className={buttonClasses(variant, size, typeof className === 'string' ? className : undefined)} {...rest} />
}
