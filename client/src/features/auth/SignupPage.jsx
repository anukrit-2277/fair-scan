import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineBuildingOffice2,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/layout/AuthLayout';
import { Button, Input, Divider } from '../../components/common';
import { registerUser, clearError } from './authSlice';
import useForm from '../../hooks/useForm';
import './AuthPages.css';

const validate = (values) => {
  const errors = {};
  if (!values.name.trim()) errors.name = 'Name is required';
  if (!values.email) errors.email = 'Email is required';
  else if (!/\S+@\S+\.\S+/.test(values.email)) errors.email = 'Invalid email address';
  if (!values.password) errors.password = 'Password is required';
  else if (values.password.length < 8) errors.password = 'Must be at least 8 characters';
  if (values.password && values.confirmPassword && values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
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

const SignupPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((s) => s.auth);

  const { values, errors, handleChange, handleBlur, handleSubmit } = useForm(
    { name: '', email: '', password: '', confirmPassword: '', organization: '' },
    validate
  );

  useEffect(() => {
    if (isAuthenticated) {
      toast.success('Account created — welcome to FairScan!');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const onSubmit = ({ confirmPassword: _, ...formValues }) => {
    dispatch(registerUser(formValues));
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start auditing your AI models for bias in minutes."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="auth-form">
          <motion.div variants={fadeIn} initial="hidden" animate="visible" custom={0}>
            <Input
              label="Full name"
              name="name"
              placeholder="Jane Smith"
              icon={<HiOutlineUser />}
              value={values.name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.name}
              autoComplete="name"
            />
          </motion.div>

          <motion.div variants={fadeIn} initial="hidden" animate="visible" custom={1}>
            <Input
              label="Work email"
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

          <motion.div className="auth-form__row" variants={fadeIn} initial="hidden" animate="visible" custom={2}>
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="Min. 8 characters"
              icon={<HiOutlineLockClosed />}
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.password}
              autoComplete="new-password"
            />
            <Input
              label="Confirm password"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter password"
              icon={<HiOutlineLockClosed />}
              value={values.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.confirmPassword}
              autoComplete="new-password"
            />
          </motion.div>

          <motion.div variants={fadeIn} initial="hidden" animate="visible" custom={3}>
            <Input
              label="Organization (optional)"
              name="organization"
              placeholder="Acme Corp"
              icon={<HiOutlineBuildingOffice2 />}
              value={values.organization}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.organization}
            />
          </motion.div>

          <motion.div variants={fadeIn} initial="hidden" animate="visible" custom={4}>
            <Button type="submit" fullWidth size="lg" loading={loading}>
              Create Account
            </Button>
          </motion.div>
        </div>
      </form>

      <motion.div variants={fadeIn} initial="hidden" animate="visible" custom={5}>
        <Divider text="or" />
        <p className="auth-footer-text">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
};

export default SignupPage;
