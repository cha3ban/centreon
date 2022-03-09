import * as React from 'react';

import { Formik } from 'formik';
import { useTranslation } from 'react-i18next';

import { makeStyles } from '@mui/styles';

import { useRequest, useSnackbar } from '@centreon/ui';

import useValidationSchema from '../useValidationSchema';
import {
  labelFailedToSaveWebSSOConfiguration,
  labelWebSSOConfigurationSaved,
} from '../translatedLabels';
import { putOpenidConfiguration } from '../../api';
import { WebSSOConfiguration } from '../models';
import FormButtons from '../../FormButtons';

import Inputs from './Inputs';

const useStyles = makeStyles((theme) => ({
  formContainer: {
    margin: theme.spacing(2, 1, 1),
  },
}));

interface Props {
  initialValues: WebSSOConfiguration;
  loadWebSSOonfiguration: () => void;
}

const Form = ({
  initialValues,
  loadWebSSOonfiguration,
}: Props): JSX.Element => {
  const classes = useStyles();
  const { t } = useTranslation();

  const { sendRequest } = useRequest({
    defaultFailureMessage: t(labelFailedToSaveWebSSOConfiguration),
    request: putOpenidConfiguration,
  });
  const { showSuccessMessage } = useSnackbar();

  const validationSchema = useValidationSchema();

  const submit = (
    values: WebSSOConfiguration,
    { setSubmitting },
  ): Promise<void> =>
    sendRequest(values)
      .then(() => {
        loadWebSSOonfiguration();
        showSuccessMessage(t(labelWebSSOConfigurationSaved));
      })
      .finally(() => setSubmitting(false));

  return (
    <Formik
      enableReinitialize
      validateOnBlur
      validateOnMount
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={submit}
    >
      <div className={classes.formContainer}>
        <Inputs />
        <FormButtons />
      </div>
    </Formik>
  );
};

export default Form;
