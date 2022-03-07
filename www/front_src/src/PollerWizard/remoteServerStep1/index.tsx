import * as React from 'react';

import { isNil } from 'ramda';
import { useTranslation } from 'react-i18next';
import { useUpdateAtom } from 'jotai/utils';

import { Typography, Button, FormControlLabel, Checkbox } from '@mui/material';
import Radio from '@mui/material/Radio';

import { postData, useRequest, TextField, SelectField } from '@centreon/ui';

import { setRemoteServerWizardDerivedAtom } from '../PollerAtoms';
import { useStyles } from '../../styles/partials/form/PollerWizardStyle';

const remoteServerWaitListEndpoint =
  './api/internal.php?object=centreon_configuration_remote&action=getWaitList';

interface Props {
  goToNextStep: () => void;
  goToPreviousStep: () => void;
}

interface RemoteServerStepOneFormData {
  centreon_central_ip: string;
  centreon_folder: string;
  db_password: string;
  db_user: string;
  no_check_certificate: boolean;
  no_proxy: boolean;
  server_ip: string;
  server_name: string;
}

interface RemoteServerStepOneFormDataError {
  centreon_central_ip: string;
  centreon_folder: string;
  db_password: string;
  db_user: string;
  server_ip: string;
  server_name: string;
}

interface WaitList {
  id: string;
  ip: string;
  server_name: string;
}

const FormRemoteServerStepOne = ({
  goToNextStep,
  goToPreviousStep,
}: Props): JSX.Element => {
  const classes = useStyles();
  const { t } = useTranslation();
  const [waitList, setWaitList] = React.useState<Array<WaitList> | null>(null);
  const [initialized, setInitialized] = React.useState(false);
  const [inputTypeManual, setInputTypeManual] = React.useState(true);

  const [stepOneFormData, setStepOneFormData] =
    React.useState<RemoteServerStepOneFormData>({
      centreon_central_ip: '',
      centreon_folder: '/centreon/',
      db_password: '',
      db_user: '',
      no_check_certificate: false,
      no_proxy: false,
      server_ip: '',
      server_name: '',
    });

  const [error, setError] = React.useState<RemoteServerStepOneFormDataError>({
    centreon_central_ip: '',
    centreon_folder: '',
    db_password: '',
    db_user: '',
    server_ip: '',
    server_name: '',
  });

  const { sendRequest } = useRequest<Array<WaitList>>({
    request: postData,
  });

  const setWizard = useUpdateAtom(setRemoteServerWizardDerivedAtom);

  const getWaitList = (): void => {
    sendRequest({
      data: null,
      endpoint: remoteServerWaitListEndpoint,
    })
      .then((data): void => {
        setWaitList(data);
      })
      .catch(() => {
        setWaitList([]);
      });
  };

  const initializeFromRest = (value): void => {
    setInitialized(true);
    setInputTypeManual(!value);
  };

  const handleChange = (event): void => {
    const { value, name } = event.target;

    if (name === 'no_check_certificate' || name === 'no_proxy') {
      setStepOneFormData({
        ...stepOneFormData,
        [name]: !stepOneFormData[name],
      });

      return;
    }

    setError({
      ...error,
      [name]: value.trim() === '' ? 'required' : '',
    });

    setStepOneFormData({
      ...stepOneFormData,
      [name]: value,
    });
  };

  const handleBlur = (event): void => {
    const { value, name } = event.target;

    setError({
      ...error,
      [name]: value.trim() === '' ? 'required' : '',
    });
  };

  const handleSubmit = (event): void => {
    event.preventDefault();

    setWizard(stepOneFormData);
    goToNextStep();
  };

  const nextDisabled =
    Object.values(stepOneFormData).some((x) => x === '') ||
    Object.values(error).some((x) => x !== '');

  React.useEffect(() => {
    getWaitList();
  }, []);

  React.useEffect(() => {
    if (waitList) {
      const platform = waitList.find(
        (server) => server.ip === stepOneFormData.server_ip,
      );
      if (platform) {
        setStepOneFormData({
          ...stepOneFormData,
          server_name: platform.server_name,
        });
      }
    }
  }, [stepOneFormData.server_ip]);

  React.useEffect(() => {
    if (isNil(waitList) || initialized) {
      return;
    }
    initializeFromRest(waitList.length > 0);
  }, [waitList]);

  return (
    <div>
      <div className={classes.formHeading}>
        <Typography variant="h6">{t('Server Configuration')}</Typography>
      </div>
      <form autoComplete="off" onSubmit={handleSubmit}>
        <div className={classes.wizardRadio}>
          <FormControlLabel
            checked={inputTypeManual}
            control={<Radio color="primary" size="small" />}
            label={`${t('Create new Remote Server')}`}
            onClick={(): void => setInputTypeManual(true)}
          />
          <FormControlLabel
            checked={!inputTypeManual}
            control={<Radio color="primary" size="small" />}
            label={`${t('Select a Remote Server')}`}
            onClick={(): void => setInputTypeManual(false)}
          />
        </div>
        {inputTypeManual ? (
          <div className={classes.form}>
            <TextField
              fullWidth
              required
              error={
                error.server_name.length > 0 ? error.server_name : undefined
              }
              label={`${t('Server Name')}`}
              name="server_name"
              value={stepOneFormData.server_name}
              onBlur={handleBlur}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              required
              error={error.server_ip.length > 0 ? error.server_ip : undefined}
              label={`${t('Server IP address')}`}
              name="server_ip"
              value={stepOneFormData.server_ip}
              onBlur={handleBlur}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              required
              error={error.db_user.length > 0 ? error.db_user : undefined}
              label={`${t('Database username')}`}
              name="db_user"
              value={stepOneFormData.db_user}
              onBlur={handleBlur}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              required
              error={
                error.db_password.length > 0 ? error.db_password : undefined
              }
              label={`${t('Database password')}`}
              name="db_password"
              type="password"
              value={stepOneFormData.db_password}
              onBlur={handleBlur}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              required
              error={
                error.centreon_central_ip.length > 0
                  ? error.centreon_central_ip
                  : undefined
              }
              label={`${t(
                'Centreon Central IP address, as seen by this server',
              )}`}
              name="centreon_central_ip"
              value={stepOneFormData.centreon_central_ip}
              onBlur={handleBlur}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              required
              error={
                error.centreon_folder.length > 0
                  ? error.centreon_folder
                  : undefined
              }
              label={`${t('Centreon Web Folder on Remote')}`}
              name="centreon_folder"
              value={stepOneFormData.centreon_folder}
              onBlur={handleBlur}
              onChange={handleChange}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={stepOneFormData.no_check_certificate}
                  name="no_check_certificate"
                  onChange={handleChange}
                />
              }
              label={`${t('Do not check SSL certificate validation')}`}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={stepOneFormData.no_proxy}
                  name="no_proxy"
                  onChange={handleChange}
                />
              }
              label={`${t(
                'Advanced: reverse Centreon Broker communication flow',
              )}`}
            />
          </div>
        ) : (
          <div className={classes.form}>
            {waitList && waitList.length !== 0 ? (
              <SelectField
                fullWidth
                label={`${t('Select Pending Remote Links')}`}
                name="server_ip"
                options={waitList.map((c) => ({ id: c.ip, name: c.ip }))}
                selectedOptionId={stepOneFormData.server_ip}
                onChange={handleChange}
              />
            ) : null}
            <TextField
              fullWidth
              required
              error={
                error.server_name.length > 0 ? error.server_name : undefined
              }
              label={`${t('Server Name')}`}
              name="server_name"
              value={stepOneFormData.server_name}
              onBlur={handleBlur}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              required
              error={error.server_ip.length > 0 ? error.server_ip : undefined}
              label={`${t('Server IP address')}`}
              name="server_ip"
              value={stepOneFormData.server_ip}
              onBlur={handleBlur}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              required
              error={error.db_user.length > 0 ? error.db_user : undefined}
              label={`${t('Database username')}`}
              name="db_user"
              value={stepOneFormData.db_user}
              onBlur={handleBlur}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              required
              error={
                error.db_password.length > 0 ? error.db_password : undefined
              }
              label={`${t('Database password')}`}
              name="db_password"
              type="password"
              value={stepOneFormData.db_password}
              onBlur={handleBlur}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              required
              error={
                error.centreon_central_ip.length > 0
                  ? error.centreon_central_ip
                  : undefined
              }
              label={`${t(
                'Centreon Central IP address, as seen by this server',
              )}`}
              name="centreon_central_ip"
              value={stepOneFormData.centreon_central_ip}
              onBlur={handleBlur}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              required
              error={
                error.centreon_folder.length > 0
                  ? error.centreon_folder
                  : undefined
              }
              label={`${t('Centreon Web Folder on Remote')}`}
              name="centreon_folder"
              value={stepOneFormData.centreon_folder}
              onBlur={handleBlur}
              onChange={handleChange}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={stepOneFormData.no_check_certificate}
                  name="no_check_certificate"
                  onChange={handleChange}
                />
              }
              label={`${t('Do not check SSL certificate validation')}`}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={stepOneFormData.no_proxy}
                  name="no_proxy"
                  onChange={handleChange}
                />
              }
              label={`${t(
                'Advanced: reverse Centreon Broker communication flow',
              )}`}
            />
          </div>
        )}
        <div className={classes.formButton}>
          <Button size="small" onClick={goToPreviousStep}>
            {t('Previous')}
          </Button>
          <Button
            color="primary"
            disabled={nextDisabled}
            size="small"
            type="submit"
            variant="contained"
          >
            {t('Next')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FormRemoteServerStepOne;
