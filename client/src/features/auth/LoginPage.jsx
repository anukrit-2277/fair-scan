import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { HiOutlineEnvelope, HiOutlineLockClosed } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/layout/AuthLayout';
import { Button, Input, Divider } from '../../components/common';
import { loginUser, clearError } from './authSlice';
import useForm from '../../hooks/useForm';
import './AuthPages.css';

const validate = (values) => {
  const errors = {};
  if (!values.email) errors.email = 'Email is required';
  else if (!/\S+@\S+\.\S+/.test(values.email)) errors.email = 'Invalid email address';
  if (!values.password) errors.password = 'Password is required';
  return errors;
};

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  }),
};

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((s) => s.auth);

  const { values, errors, handleChange, handleBlur, handleSubmit } = useForm(
    { email: '', password: '' },
    validate
  );

  useEffect(() => {
    if (isAuthenticated) {
      toast.success('Welcome back!');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const onSubmit = (formValues) => {
    dispatch(loginUser(formValues));
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue to your FairScan dashboard."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="auth-form">
          <motion.div variants={fadeIn} initial="hidden" animate="visible" custom={0}>
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="you@company.com"
              icon={<HiOutlineEnvelope />}
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.email}
              autoComplete="email"
            />
          </motion.div>

          <motion.div variants={fadeIn} initial="hidden" animate="visible" custom={1}>
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="Enter your password"
              icon={<HiOutlineLockClosed />}
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.password}
              autoComplete="current-password"
            />
          </motion.div>

          <motion.div variants={fadeIn} initial="hidden" animate="visible" custom={2}>
            <Button type="submit" fullWidth size="lg" loading={loading}>
              Sign In
            </Button>
          </motion.div>
        </div>
      </form>

      <motion.div variants={fadeIn} initial="hidden" animate="visible" custom={3}>
        <Divider text="or" />
        <p className="auth-footer-text">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="auth-link">Create one</Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
};

export default LoginPage;
