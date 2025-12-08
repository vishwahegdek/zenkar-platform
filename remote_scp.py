import pexpect
import sys

def scp_file(user, host, password, local_file, remote_path):
    ssh_newkey = 'Are you sure you want to continue connecting'
    cmd = f'scp {local_file} {user}@{host}:{remote_path}'
    child = pexpect.spawn(cmd)
    
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
    child.expect(pexpect.EOF, timeout=600) # Increased transfer timeout to 10m
    print("Transfer complete.")

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: remote_scp.py <local> <remote>")
        sys.exit(1)
        
    user = 'vishwa'
    host = '160.250.204.219'
    password = 'katte2934'
    local_file = sys.argv[1]
    remote_path = sys.argv[2]
    scp_file(user, host, password, local_file, remote_path)
