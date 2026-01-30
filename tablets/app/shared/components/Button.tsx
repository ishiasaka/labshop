import {
  CircularProgress,
  Button as MUIButton,
  ButtonProps as MUIButtonProps,
} from '@mui/material';

const Button = ({
  children,
  loading,
  loadingIndicatorSize = '20px',
  ...rest
}: MUIButtonProps & {
  loadingIndicatorSize?: string;
}) => {
  return (
    <MUIButton
      disableElevation
      loading={loading}
      loadingIndicator={<></>}
      {...rest}
    >
      {loading ? <CircularProgress size={loadingIndicatorSize} /> : children}
    </MUIButton>
  );
};

export default Button;
