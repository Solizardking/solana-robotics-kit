// entrypoints/sidepanel/routes/CreateWallet.tsx
/**
 * Route for creating new Solana wallets (generating new keypairs)
 * Supports both user wallets and agent wallets
 */

import { Button, Group, TextInput, Title, Stack, Textarea, Space, Switch, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconRobot, IconUser } from '@tabler/icons-react';
import { useCallback, useState } from 'react';
import { useNavigate, useRouteLoaderData } from 'react-router-dom';
import TagsInput from '../components/TagsInput';
import type { FilteredAccountsLoaderData } from './FilteredAccounts';

export default function CreateWallet() {
  const { tags } = useRouteLoaderData('accounts-route') as FilteredAccountsLoaderData;
  const navigate = useNavigate();

  const [labelInputValue, setLabelInputValue] = useState('');
  const [notesInputValue, setNotesInputValue] = useState('');
  const [isAgentWallet, setIsAgentWallet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tagNames = tags.map((t) => t.tagName);

  const cancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    formData.append('isAgentWallet', isAgentWallet.toString());

    try {
      const response = await browser.runtime.sendMessage({
        type: isAgentWallet ? 'create_agent_wallet' : 'create_wallet',
        options: {
          label: labelInputValue.trim(),
          isAgentWallet,
          notes: notesInputValue,
          tags: formData.get('tagsInput') ? JSON.parse(formData.get('tagsInput') as string) : [],
        },
      });

      if (response.success) {
        notifications.show({
          title: 'Wallet Created',
          message: `Successfully created ${isAgentWallet ? 'agent' : 'user'} wallet`,
          color: 'green',
          autoClose: 5000,
        });
        navigate('/sidepanel.html');
      } else {
        notifications.show({
          title: 'Error',
          message: response.error || 'Failed to create wallet',
          color: 'red',
          autoClose: 10_000,
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        color: 'red',
        autoClose: 10_000,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [labelInputValue, notesInputValue, isAgentWallet, navigate]);

  return (
    <Stack gap="lg">
      <Title order={1} lineClamp={1}>
        Create New Wallet
      </Title>

      <Text size="sm" c="dimmed">
        Generate a new Solana wallet with a unique keypair. The private key will be securely stored and encrypted.
      </Text>

      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Wallet Label"
            name="labelInput"
            type="text"
            value={labelInputValue}
            onChange={(e) => setLabelInputValue(e.currentTarget.value)}
            placeholder={isAgentWallet ? 'Agent Wallet 1' : 'My Wallet'}
            required
            withAsterisk
            styles={{
              input: {
                backgroundColor: 'transparent',
              },
            }}
          />

          <Switch
            label={
              <Group gap="xs">
                {isAgentWallet ? <IconRobot size={16} /> : <IconUser size={16} />}
                <Text>Agent Wallet</Text>
              </Group>
            }
            description={
              isAgentWallet
                ? 'This wallet will be used for automated operations and trading'
                : 'Enable to create an agent wallet for automated operations'
            }
            checked={isAgentWallet}
            onChange={(e) => setIsAgentWallet(e.currentTarget.checked)}
            color="blue"
          />

          <Textarea
            label="Notes"
            name="notesInput"
            value={notesInputValue}
            onChange={(e) => setNotesInputValue(e.currentTarget.value)}
            placeholder="Optional notes about this wallet..."
            minRows={3}
            resize="vertical"
            autosize
            styles={{
              input: {
                backgroundColor: 'transparent',
              },
            }}
          />

          <TagsInput allKnownTags={tagNames} initialTags={[]} />

          <Space h="md" />

          <Group gap="md">
            <Button
              type="submit"
              variant="filled"
              leftSection={<IconPlus size={16} />}
              autoContrast
              disabled={!labelInputValue.trim() || isSubmitting}
              loading={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Wallet'}
            </Button>
            <Button type="button" variant="outline" onClick={cancel} disabled={isSubmitting}>
              Cancel
            </Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  );
}
