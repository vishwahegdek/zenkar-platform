import pexpect
import sys
import time

def ssh_command(user, host, password, command):
    ssh_newkey = 'Are you sure you want to continue connecting'
    connStr = f'ssh -tt {user}@{host} "{command}"'
    child = pexpect.spawn(connStr)
    
    ret = child.expect([pexpect.TIMEOUT, ssh_newkey, '[P|p]assword:'], timeout=60)
    
    if ret == 0:
        print('[-] Error Connecting: Timeout')
        sys.exit(1)
    if ret == 1:
        child.sendline('yes')
        ret = child.expect([pexpect.TIMEOUT, '[P|p]assword:'], timeout=60)
        if ret == 0:
            print('[-] Error Connecting: Timeout')
            sys.exit(1)
            
    child.sendline(password)
    child.expect(pexpect.EOF, timeout=600)
    print(child.before.decode('utf-8'))

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: remote_exec.py <command>")
        sys.exit(1)

    user = 'vishwa'
    host = '160.250.204.219'
    password = 'katte2934'
    command = sys.argv[1]
    ssh_command(user, host, password, command)
