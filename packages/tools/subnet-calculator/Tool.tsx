import { useState } from 'react'
import { ActionArea, Button, CopyButton, Panel, Status } from '@tool-forge/ui'
import { calculateSubnet, formatSubnetOutput, type SubnetOutput, type SubnetResult } from './logic'
import styles from './Tool.module.css'

type PrefixType = 'prefix' | 'mask'

function SubnetResultView({ output }: { output: SubnetOutput }) {
  return (
    <dl className={styles.result} data-testid="subnet-output">
      <div>
        <dt>Network</dt>
        <dd data-testid="subnet-network">{output.network}</dd>
      </div>
      <div>
        <dt>Broadcast</dt>
        <dd data-testid="subnet-broadcast">{output.broadcast}</dd>
      </div>
      <div>
        <dt>First usable</dt>
        <dd data-testid="subnet-first">{output.firstUsable}</dd>
      </div>
      <div>
        <dt>Last usable</dt>
        <dd data-testid="subnet-last">{output.lastUsable}</dd>
      </div>
      <div>
        <dt>Usable hosts</dt>
        <dd data-testid="subnet-usable-hosts">{output.usableHosts}</dd>
      </div>
      <div>
        <dt>Total addresses</dt>
        <dd data-testid="subnet-total-addresses">{output.totalAddresses}</dd>
      </div>
      <div>
        <dt>Mask (dotted)</dt>
        <dd data-testid="subnet-mask-dotted">{output.mask.dotted}</dd>
      </div>
      <div>
        <dt>Mask (binary)</dt>
        <dd className={styles.binary} data-testid="subnet-mask-binary">
          {output.mask.binary}
        </dd>
      </div>
      <div>
        <dt>Mask (CIDR)</dt>
        <dd data-testid="subnet-mask-cidr">/{output.mask.cidr}</dd>
      </div>
      <div>
        <dt>Wildcard mask</dt>
        <dd data-testid="subnet-wildcard">{output.wildcard}</dd>
      </div>
    </dl>
  )
}

export function SubnetCalculatorTool() {
  const [ip, setIp] = useState('')
  const [prefixType, setPrefixType] = useState<PrefixType>('prefix')
  const [value, setValue] = useState('')
  const [result, setResult] = useState<SubnetResult | null>(null)

  const handleCalculate = () => {
    setResult(calculateSubnet(ip, value))
  }

  const handleClear = () => {
    setIp('')
    setValue('')
    setResult(null)
  }

  return (
    <div className={styles.layout}>
      <Panel title="Input">
        <label className={styles.fieldLabel}>
          <span>IP address</span>
          <input
            className="field"
            aria-label="IP address"
            placeholder="192.168.1.129"
            value={ip}
            onChange={(event) => setIp(event.target.value)}
            spellCheck={false}
          />
        </label>
        <label className={styles.fieldLabel}>
          <span>Prefix type</span>
          <select
            className="field"
            aria-label="Prefix type"
            value={prefixType}
            onChange={(event) => setPrefixType(event.target.value as PrefixType)}
          >
            <option value="prefix">CIDR prefix</option>
            <option value="mask">Subnet mask</option>
          </select>
        </label>
        <label className={styles.fieldLabel}>
          <span>{prefixType === 'prefix' ? 'Prefix' : 'Subnet mask'}</span>
          <input
            className="field"
            aria-label={prefixType === 'prefix' ? 'Prefix' : 'Subnet mask'}
            placeholder={prefixType === 'prefix' ? '24' : '255.255.255.0'}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            spellCheck={false}
          />
        </label>
      </Panel>

      <ActionArea>
        <Button onClick={handleCalculate}>Calculate</Button>
        <Button
          variant="secondary"
          onClick={handleClear}
          disabled={ip === '' && value === '' && result === null}
        >
          Clear
        </Button>
      </ActionArea>

      <Panel
        title="Output"
        actions={result?.ok ? <CopyButton value={formatSubnetOutput(result.output)} /> : undefined}
      >
        {result?.ok ? <SubnetResultView output={result.output} /> : null}
        {result !== null && !result.ok ? <Status kind="error">{result.error}</Status> : null}
        {result === null ? <p className="muted">Subnet details will appear here.</p> : null}
      </Panel>
    </div>
  )
}
